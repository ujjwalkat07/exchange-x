import { Redis } from "./redis-connection";

export const redisInit = async () => {
  try {
    await Redis.connect();
  } catch (error) {
    console.log(error);
  }
};
