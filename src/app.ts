import dotenv from 'dotenv';
import { startServer } from './server/socket';

dotenv.config();

export async function startApp() {
  try {
    startServer();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
