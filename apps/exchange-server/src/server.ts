import './dns-setup';
import { httpServer } from "./app";
import dbConnect from "./config/db-config/db-connection";
import { config } from "./config/env-config/config";

const startServer = async () => {
  await dbConnect();
  httpServer.listen(config.PORT, () => {
    console.log(`server running on port http://localhost:${config.PORT}`);
  });
};

startServer();
