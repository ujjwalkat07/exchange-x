import { Producer, Admin, CompressionTypes } from "kafkajs";
import kafkaConfig from "../../config/kafka-config/kafka-config";

import SnappyCodec from "kafkajs-snappy";
import { CompressionCodecs } from "kafkajs";
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

class KafkaProducer {
  private admin: Admin;
  private producer: Producer;

  constructor() {
    this.producer = kafkaConfig.getClient().producer({
      idempotent: false,
      maxInFlightRequests: 5,
      allowAutoTopicCreation: false,
      retry: {
        retries: 3,
        maxRetryTime: 3000,
      },
    });
    this.admin = kafkaConfig.getClient().admin();
  }

  async connectToProducer(): Promise<void> {
    try {
      await this.admin.connect();
      await this.producer.connect();
      console.log("Kafka Producer connected");
    } catch (error) {
      console.log(error);
    }
  }

  sendToConsumer(key: string, topic: string, message: string): void {
    try {
      this.producer.send({
        topic,
        messages: [
          {
            key: `${key}`,
            value: message,
          },
        ],
        compression: CompressionTypes.Snappy,
        timeout: 5000,
        acks: 0,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.admin.disconnect();
    } catch (error) {
      console.log(error);
    }
  }
}

const Kafka = new KafkaProducer();
export { Kafka };
