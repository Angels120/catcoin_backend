import dotenv from 'dotenv';
import startMongo from './utils/start-mongo';
import { initTeams } from './utils/init';
import { initializeDefaultTasks } from './models/Task';
import { runDailyReset } from './utils/schedule';
import { initializeDefaultEras } from './models/Era';
import { setTotalScore } from './service/main';
import { initAdmin } from './models/Admin';

dotenv.config();

export async function startBot() {
  try {
    await startMongo();
    console.log('MongoDB connected');
    await initTeams();
    await initializeDefaultTasks();
    await initializeDefaultEras();
    await initAdmin();
    await setTotalScore();
    // runDailyReset();
    console.log('Telegram bot started');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
