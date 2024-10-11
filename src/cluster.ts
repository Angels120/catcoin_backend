import cluster from 'cluster';
import os from 'os';
import dotenv from 'dotenv';
import { startApp } from './app';
import { startClickRegeneration, monitorTotalScore } from './server/handlers/regenerateClicks';
import { startBot } from './botServer';

// Load environment variables
dotenv.config();

function startTheApp() {
  {
    if (cluster.isPrimary) {
      const numCPUs = os.cpus().length;
      console.log(`Master ${process.pid} is running`);

      // Fork workers.
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        // Optionally, you can restart a worker when it dies
        cluster.fork();
      });
      monitorTotalScore();
    } else {
      // Workers can share any TCP connection.
      // In this case, it is an HTTP server.
      startApp();

      console.log(`Worker ${process.pid} started`);
    }
  }
}
// startClickRegeneration();

startBot();
startTheApp();
// startApp();
