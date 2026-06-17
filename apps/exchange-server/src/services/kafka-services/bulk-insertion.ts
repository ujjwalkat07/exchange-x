import { Redis } from "../../config/redis-config/redis-connection";
import { orderHistory } from "../order-services/order-history/trade-history-model";
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

    // Query all involved orders in a single DB call
    const batchOrderIds = batch.map((o) => o.orderId);
    const tradeOrderIds = allTrades.flatMap((t) => [t.buyerOrderId, t.sellerOrderId]);
    const involvedOrderIds = Array.from(new Set([...batchOrderIds, ...tradeOrderIds]));

    const involvedOrders = await Order.find({ orderId: { $in: involvedOrderIds } }).lean();
    //here orderMap contain only the id of involved orders
    const ordersMap = new Map<string, any>();
    for (const order of involvedOrders) {
      ordersMap.set(order.orderId, order);
    }

    // Track total traded quantity and amount per order
    const orderStats = new Map<string, { tradedQty: number; tradedAmount: number }>();
    for (const trade of allTrades) {
      // Buyer
      if (!orderStats.has(trade.buyerOrderId)) {
        orderStats.set(trade.buyerOrderId, { tradedQty: 0, tradedAmount: 0 });
      }
      const buyerStat = orderStats.get(trade.buyerOrderId)!;
      buyerStat.tradedQty += trade.tradedQuantity;
      buyerStat.tradedAmount += trade.tradedQuantity * trade.executionPrice;

      // Seller
      if (!orderStats.has(trade.sellerOrderId)) {
        orderStats.set(trade.sellerOrderId, { tradedQty: 0, tradedAmount: 0 });
      }
      const sellerStat = orderStats.get(trade.sellerOrderId)!;
      sellerStat.tradedQty += trade.tradedQuantity;
      sellerStat.tradedAmount += trade.tradedQuantity * trade.executionPrice;
    }

    const orderStatusOps = [];
    const tradeWalletOps = [];
    const ordermulti = Redis.getClient().multi();

    // Now process all involved orders
    for (const orderId of involvedOrderIds) {
      const order = ordersMap.get(orderId);
      if (!order) continue;

      const stats = orderStats.get(orderId) || { tradedQty: 0, tradedAmount: 0 };
      const totalTradedQty = stats.tradedQty;
      const totalTradedAmount = stats.tradedAmount;
      const avgPrice = totalTradedQty > 0 ? totalTradedAmount / totalTradedQty : 0;
      const remainingQty = order.orderQuantity - totalTradedQty;

      if (order.orderType === "Market") {
        // Market Order
        if (totalTradedQty > 0) {
          // Partially or fully filled market order
          orderStatusOps.push({
            updateOne: {
              filter: { orderId },
              update: {
                positionStatus: "Filled",
                orderQuantity: totalTradedQty,
                orderAmount: totalTradedAmount,
                entryPrice: avgPrice,
              },
            },
          });
        } else {
          // Unfilled market order
          orderStatusOps.push({
            updateOne: {
              filter: { orderId },
              update: {
                positionStatus: "Cancelled",
                orderQuantity: 0,
                orderAmount: 0,
                entryPrice: 0,
              },
            },
          });
        }

        // Refund unused balance for market order
        if (order.orderSide === "BUY") {
          const unusedAmount = order.orderAmount - totalTradedAmount;
          if (unusedAmount > 0) {
            tradeWalletOps.push({
              updateOne: {
                filter: { user: order.user, asset: "USDT" },
                update: { $inc: { balance: unusedAmount } },
                upsert: true,
              },
            });
          }
        } else {
          const unusedQty = order.orderQuantity - totalTradedQty;
          if (unusedQty > 0) {
            tradeWalletOps.push({
              updateOne: {
                filter: { user: order.user, asset: order.currencyPair.toUpperCase().replace("USDT", "") },
                update: { $inc: { balance: unusedQty } },
                upsert: true,
              },
            });
          }
        }

        // Remove from open orders cache
        ordermulti.sRem(`openOrders:userId:${order.user}`, orderId);
        ordermulti.del(`orderdetail:orderID:${orderId}`);
      } else {
        // Limit Order
        if (totalTradedQty > 0) {
          orderStatusOps.push({
            updateOne: {
              filter: { orderId },
              update: {
                positionStatus: remainingQty <= 0 ? "Filled" : "Open",
                ...(remainingQty > 0 ? { orderQuantity: remainingQty } : {}),
                entryPrice: avgPrice,
              },
            },
          });

          if (remainingQty <= 0) {
            ordermulti.sRem(`openOrders:userId:${order.user}`, orderId);
            ordermulti.del(`orderdetail:orderID:${orderId}`);
          }
        }
      }
    }

    if (orderStatusOps.length > 0) {
      await Order.bulkWrite(orderStatusOps, { ordered: false });
    }

    // Build standard trade wallet updates (crediting filled assets)
    for (const trade of allTrades) {
      // Buyer gets the asset
      tradeWalletOps.push({
        updateOne: {
          filter: {
            user: trade.buyerUserId,
            asset: trade.currencyPair.toUpperCase().replace("USDT", ""),
          },
          update: { $inc: { balance: trade.tradedQuantity } },
          upsert: true,
        },
      });
      // Seller gets USDT
      tradeWalletOps.push({
        updateOne: {
          filter: { user: trade.sellerUserId, asset: "USDT" },
          update: { $inc: { balance: trade.tradedQuantity * trade.executionPrice } },
          upsert: true,
        },
      });
    }

    if (tradeWalletOps.length > 0) {
      await Wallet.bulkWrite(tradeWalletOps, { ordered: false });

      // Clear Redis wallet caches for all users involved in trades/refunds
      const uniqueUserIds = Array.from(new Set([
        ...batch.map(o => o.user),
        ...allTrades.flatMap(t => [t.buyerUserId, t.sellerUserId])
      ]));
      for (const userId of uniqueUserIds) {
        ordermulti.del(`wallet:${userId}`);
        ordermulti.del(`all:wallet:${userId}`);
      }
    }

    await ordermulti.exec();

    if (allTrades.length > 0) {
      emit("order", "Order Executed Successfully");
      //push alltrades to orderHistory collection
      await orderHistory.insertMany(allTrades);
    }
    console.log(`Processed batch of ${batch.length} orders.`);
  } catch (error) {
    console.error("Flush failed:", error);
    messages.push(...batch);
  } finally {
    processing = false;
  }
};
