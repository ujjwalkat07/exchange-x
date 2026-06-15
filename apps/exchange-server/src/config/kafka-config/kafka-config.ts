import { Kafka, logLevel } from "kafkajs";
import { config } from "../env-config/config";

const ca = Buffer.from(String(config.KAFKA_CERT), "base64").toString("utf-8");

class KafkaConfig {
  private kafka: Kafka;
  private brokers: string;

  constructor() {
    this.brokers = String(config.KAFKA_URI);
    this.kafka = new Kafka({
      clientId: "my-app",
      brokers: [this.brokers],
      ssl: {
        ca: [ca],
      },
      sasl: {
        mechanism: "plain",
        username: String(config.KAFKA_USERNAME),
        password: String(config.KAFKA_PASSWORD),
      },
      logLevel: logLevel.ERROR,
    });
  }
  getClient(): Kafka {
    return this.kafka;
  }
}

export default new KafkaConfig();
