import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

const _config = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
  MONGO_DB_URI: process.env.MONGO_DB_URI,
  KAFKA_URI: process.env.KAFKA_URI,
  KAFKA_USERNAME: process.env.KAFKA_USERNAME,
  KAFKA_PASSWORD: process.env.KAFKA_PASSWORD,
  REDIS_URI: process.env.REDIS_URI,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_PORT: process.env.REDIS_PORT,
  PORT : process.env.PORT,
  KAFKA_CERT:process.env.KAFKA_CERT,
  CORS_URL:process.env.CORS_URL
};

export const config = Object.freeze(_config);
