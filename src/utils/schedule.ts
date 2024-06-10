import later from "@breejs/later";
import { removeDailyTasksFromUsers } from "../models/User";

const everyDay = later.parse.recur().on(0).hour().every(1).dayOfMonth();
const every5Seconds = later.parse.recur().every(5).second();

async function dailyReset() {
	await removeDailyTasksFromUsers();
}

// Schedule your function to run every day at 00:00
export function runDailyReset() {
	later.setInterval(dailyReset, everyDay);
}

// Schedule your function to run every 2 weeks on Monday at 00:00
