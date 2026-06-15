import { createClient, RedisClientType } from "redis";
import { config } from "../env-config/config";

class RedisConnection {
  private redis: RedisClientType;
  private isConnected = false;

  constructor() {
    this.redis = createClient({
      url: String(config.REDIS_URI),
    });
    // {
    //       url: config.REDIS_URI,
    //     }
    this.redis.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    this.redis.on("connect", () => {
      console.log("Redis connecting...");
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
    this.isConnected = true;
    console.log("Successfully connected to Redis");
  }

  getClient(): RedisClientType {
    if (!this.isConnected) {
      throw new Error("Redis not connected. Call Redis.connect() first.");
    }
    return this.redis;
  }
}

const Redis = new RedisConnection();
export { Redis };
