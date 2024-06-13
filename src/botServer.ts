import dotenv from 'dotenv';
import startMongo from './utils/start-mongo';
import { initTeams } from './utils/init';
import { initializeDefaultTasks } from './models/Task';
import { runDailyReset } from './utils/schedule';

dotenv.config();

export async function startBot() {
  try {
    await startMongo();
    console.log('MongoDB connected');
    await initTeams();
    await initializeDefaultTasks();
    runDailyReset();
    console.log('Telegram bot started');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
