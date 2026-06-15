import cluster from "node:cluster";
import os from "node:os";
import path from "path";

const cpuCount = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary PID ${process.pid}`);
  console.log(`Total CPUs: ${cpuCount}`);

  cluster.setupPrimary({
    exec: path.resolve("./src/server.ts"),
  });

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting`);
    cluster.fork();
  });
} else {
  // ❗ NOTHING here
  // server.ts will run inside workers
}
