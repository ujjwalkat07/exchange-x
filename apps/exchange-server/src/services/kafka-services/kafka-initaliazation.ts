import { IOrder } from "../order-services/place-orders/order-model";
import { bulkInsertion } from "./bulk-insertion";

import kafkaConsumer from "../../config/kafka-config/kafka-consumer";
import { Kafka } from "../../config/kafka-config/kafka-producer";
import { emitToClients } from "../../app";

const messages: IOrder[] = [];

export const initKafkaService = async () => {
  try {
    await Kafka.connectToProducer();
    await kafkaConsumer.connectToConsumer();
    await kafkaConsume();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const kafkaConsume = async () => {
  try {
    await kafkaConsumer.subscribeToTopic("orders-detail");

    // Set up interval once, not per message
    setInterval(() => bulkInsertion(messages, emitToClients), 5000);

    await kafkaConsumer.consume(async (message) => {
      // Add message to the batch
      messages.push(message);
      // Immediate bulk insertion if threshold reached
      if (messages.length >= 1000) {
        await bulkInsertion(messages, emitToClients);
      }
    });
  } catch (error) {
    console.log(error);
  }
};
