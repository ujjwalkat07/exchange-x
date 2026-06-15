import { Redis } from "../config/redis-config/redis-connection";
import { IOrder } from "../services/order-services/place-orders/order-model";


// interface IOrders {
//   score: number;
//   value: string;
// }
export const orderMatchingEngine = async (message: IOrder) => {
  // for buy order
  const { user, currencyPair, orderSide, orderQuantity, orderId, entryPrice } =
    message;
  const id = user;
  let userQty = Number(orderQuantity);
  const userOrderId = orderId;

  const buyBook = `orderbook:${currencyPair}:BUY`;
  const sellBook = `orderbook:${currencyPair}:SELL`;

  const userBook = orderSide === "BUY" ? buyBook : sellBook;
  const oppositeBook = orderSide === "BUY" ? sellBook : buyBook;

  const trades = [];

  while (userQty > 0) {
    const order =
      orderSide === "BUY"
        ? await Redis.getClient().zRangeWithScores(oppositeBook, 0, 0)
        : await Redis.getClient().zRangeWithScores(oppositeBook, 0, 0, { REV: true });

    if (!order || order.length <= 0) break;

    const { value, score } = order[0];

    const [counterUserId, counterOrderIdStr, counterQtyStr] = value.split("|");
    const counterOrderId = String(counterOrderIdStr);
    const counterQty = Number(counterQtyStr);
    // const counterUserIdNumber = String(counterUserId);

    const bestPrice = Number(score);

    // Price check
    if (
      (orderSide === "BUY" && bestPrice > Number(entryPrice)) ||
      (orderSide === "SELL" && bestPrice < Number(entryPrice))
    ) {
      break;
    }
    const tradedQuantity = Math.min(userQty, counterQty);

    userQty = userQty - tradedQuantity;

    //removed resting order here
    await Redis.getClient().zRem(oppositeBook, value);

    const newQty = counterQty - tradedQuantity;

    if (newQty > 0) {
      await Redis.getClient().zAdd(oppositeBook, {
        score: bestPrice,
        value: `${counterUserId}|${counterOrderId}|${newQty}`,
      });
    }

    const trade = {
      currencyPair,
      buyerUserId: orderSide === "BUY" ? id : counterUserId,
      sellerUserId: orderSide === "SELL" ? id : counterUserId,
      buyerOrderId: orderSide === "BUY" ? userOrderId : counterOrderId,
      sellerOrderId: orderSide === "SELL" ? userOrderId : counterOrderId,
      tradedQuantity,
      executionPrice: bestPrice,
      orderAmount: tradedQuantity * bestPrice,
      status: userQty === 0 ? "Filled" : "Partially Filled",
    };

    trades.push(trade);
  }
  //only saved for resting order here
  if (userQty > 0) {
    await Redis.getClient().zAdd(userBook, {
      score: entryPrice,
      value: `${id}|${userOrderId}|${userQty}`,
    });
  }
  return trades;
};
