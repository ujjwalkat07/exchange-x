import { Consumer } from "kafkajs";
import kafkaConfig from "../../config/kafka-config/kafka-config";
import { IOrder } from "../../services/order-services/place-orders/order-model";

class KafkaConsumer {
  private consumer: Consumer;

  constructor() {
    this.consumer = kafkaConfig.getClient().consumer({
      groupId: "orders-deatils",
    });
  }

  async connectToConsumer(): Promise<void> {
    await this.consumer.connect();
    console.log("Kafka Consumer connected");
  }

  async subscribeToTopic(topic: string): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning: true });
  }

  async consume(callback: (kafkaMessage: IOrder) => void): Promise<void> {
    await this.consumer.run({
      autoCommit: true,
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        try {
          const parsedMessage = JSON.parse(message.value.toString());
          callback(parsedMessage);
        } catch (err) {
          console.error("Invalid JSON message", err);
        }
      },
    });
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
    } catch (error) {
      console.log(error);
    }
  }
}

export default new KafkaConsumer();
