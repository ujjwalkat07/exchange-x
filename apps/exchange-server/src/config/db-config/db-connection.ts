import mongoose from "mongoose";
import { config } from "../env-config/config";
import { ApiErrorHandling } from "../../utils/utils-export";

console.log("url", config.MONGO_DB_URI);
const dbConnect = async () => {
  try {
    await mongoose.connect(String(config.MONGO_DB_URI));
    console.log("mongoDB connected Succesfully");
  } catch (error) {
    if (error instanceof ApiErrorHandling) {
      throw new ApiErrorHandling(401, error.message, error.errors);
    }
    console.log(error);
    throw new ApiErrorHandling(501, "server error");
  }
};

export default dbConnect;
