import { Redis } from "../../config/redis-config/redis-connection";
import { orderHistory } from "../order-services/order-history/order-history-model";
import { IOrder, Order } from "../order-services/place-orders/order-model";
import { orderMatchingEngine } from "../../matching-engine-algorithm/orders-matching-engine";
import { Wallet } from "../wallet-services/wallet-model";

let processing = false;

export const bulkInsertion = async (
  messages: IOrder[],
  emit: (event: string, message: string) => void,
) => {
  if (processing || messages.length === 0) return;
  processing = true;
  const batch = messages.splice(0, 1000);
  //Start at index 0 and Remove 1000 elements and finally Return those 1000 elements

  try {
    //insert placed orders into order collection
    await Order.insertMany(batch, { ordered: false });
    //instead of one by one operation i used bulk operation here
    const walletOpss = [];

    for (const order of batch) {
      if (order.orderSide === "BUY") {
        const tokenWallet = await Redis.getClient().hGet(
          `wallet:${order.user}`,
          order.currencyPair.toUpperCase().replace("USDT", ""),
        );
        //create token wallet if not created yet
        if (tokenWallet === "NaN") {
          console.log("wallet created successfully");
          walletOpss.push({
            insertOne: {
              document: {
                user: order.user,
                asset: order.currencyPair.toUpperCase().replace("USDT", ""),
                balance: 0,
              },
            },
          });
        }
        walletOpss.push({
          updateOne: {
            filter: { user: order.user, asset: "USDT" },
            update: { $inc: { balance: -order.orderAmount } },
          },
        });
      } else {
        walletOpss.push({
          updateOne: {
            filter: {
              user: order.user,
              asset: order.currencyPair.toUpperCase().replace("USDT", ""),
            },
            update: { $inc: { balance: -order.orderQuantity } },
          },
        });
      }
    }

    //here walletops return an array of updateone operations
    await Wallet.bulkWrite(walletOpss, { ordered: false }); //why i ordered false because if one operation fails other should continue

    //after, i updated wallet balance i need to clear redis cache
    const multi = Redis.getClient().multi();

    for (const order of batch) {
      multi.del(`wallet:${order.user}`);
    }
    await multi.exec();

    emit("wallet", "Wallet Update Successfully");
    //here we execute the engine in parallel
    // matching engine start here
    const tradeResults = await Promise.all(
      batch.map((order) => orderMatchingEngine(order)),
    );

    //here tradeResults is an array of arrays [[trade1, trade2], [trade3], n number of trades] so to convert it into a single array we use flat method here

    const allTrades = tradeResults.flat();

    if (allTrades.length === 0) {
      processing = false;
      return;
    }
    emit("order", "Order Executed Successfully");

    const ordermulti = Redis.getClient().multi();
    for (const order of allTrades) {
      ordermulti.del(`openOrders:userId:${order.buyerUserId}`);
      ordermulti.del(`openOrders:userId:${order.sellerUserId}`);
      ordermulti.del(`orderdetail:orderID:${order.buyerOrderId}`);
      ordermulti.del(`orderdetail:orderID:${order.sellerOrderId}`);
    }
    await ordermulti.exec();
    //push alltrades to orderHistory collection
    await orderHistory.insertMany(allTrades);

    //now after update order history we need to update order positionStatus in Order collection
    const orderStatusOps = [];

    for (const trade of allTrades) {
      const buyerOrder = await Order.findOne({ orderId: trade.buyerOrderId });
      const sellerOrder = await Order.findOne({ orderId: trade.sellerOrderId });

      const buyerRemainingQty =
        (buyerOrder?.orderQuantity ?? 0) - trade.tradedQuantity;
      const sellerRemainingQty =
        (sellerOrder?.orderQuantity ?? 0) - trade.tradedQuantity;

      orderStatusOps.push(
        {
          updateOne: {
            filter: { orderId: trade.buyerOrderId },
            update: {
              positionStatus: buyerRemainingQty <= 0 ? "Closed" : "Open",
              orderQuantity: buyerRemainingQty > 0 ? buyerRemainingQty : 0,
            },
          },
        },
        {
          updateOne: {
            filter: { orderId: trade.sellerOrderId },
            update: {
              positionStatus: sellerRemainingQty <= 0 ? "Closed" : "Open",
              orderQuantity: sellerRemainingQty > 0 ? sellerRemainingQty : 0,
            },
          },
        },
      );
    }

    await Order.bulkWrite(orderStatusOps, { ordered: false });

    const tradeWalletOps = [];

    for (const trade of allTrades) {
      tradeWalletOps.push({
        updateOne: {
          filter: {
            user: trade.buyerUserId,
            asset: trade.currencyPair.toUpperCase().replace("USDT", ""),
          },
          update: { $inc: { balance: trade.tradedQuantity } },
        },
      });
      tradeWalletOps.push({
        updateOne: {
          filter: { user: trade.sellerUserId, asset: "USDT" },
          update: {
            $inc: { balance: trade.tradedQuantity * trade.executionPrice },
          },
        },
      });
    }

    if (tradeWalletOps.length > 0) {
      await Wallet.bulkWrite(tradeWalletOps, { ordered: false });
    }
    console.log(`Processed batch of ${batch.length} orders.`);
  } catch (error) {
    console.error("Flush failed:", error);
    messages.push(...batch);
  } finally {
    processing = false;
  }
};
