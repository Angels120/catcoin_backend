import { start } from './bot';
import dotenv from 'dotenv';
import startMongo from './utils/start-mongo';
import { startServer } from './server/socket';
import { initTeams } from './utils/init';
import { initializeDefaultTasks } from './models/Task';
import { runDailyReset } from './utils/schedule';

dotenv.config();

export async function startApp() {
  try {
    startServer();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
