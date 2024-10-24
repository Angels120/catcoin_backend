import { getAllUserScoresFromRedis, getTotalScoreCache, getUserBalance, getUserScore, resetScore } from '../../cache';
import { getCurrentEra, setEraTotal } from '../../models/Era';
import { incrementScore, setUserBalance } from '../../models/User';
// Run the score update every 5 minutes
const UPDATE_SCORES_INTERVAL = 5 * 60 * 1000;

export function startBatchScoreUpdate() {
  setInterval(batchUpdateScores, UPDATE_SCORES_INTERVAL);
}

async function batchUpdateScores() {
  // Get all user scores from Redis
  const userScores = await getAllUserScoresFromRedis();

  // Update scores in the main database
  await updateScoresInDatabase(userScores);
}

async function updateScoresInDatabase(userScores: Record<string, string>) {
  // Create an array of promises for each score update
  const updatePromises = Object.keys(userScores).map((id) => {
    const score = parseInt(userScores[id]);

    return updateAndResetScore(parseInt(id.split(':')[1]), score).catch((error) => {
      console.error(`Error updating score for user ${id}:`, error);
      // Optionally, you might want to log this error to a monitoring service
    });
  });

  // Wait for all score update attempts to complete
  await Promise.all(updatePromises);
}

async function updateAndResetScore(id: number, score: number) {
  try {
    const balance = await getUserBalance(id.toString());
    // Update the score in the main database
    await incrementScore(id, score);
    await setUserBalance(id, balance);
    // Reset the score in Redis
    await resetScore(id.toString());
  } catch (error: any) {
    throw new Error(`Failed to update and reset score for user ${id}: ${error.message}`);
  }
}

export async function updateSingleUserScoreInDb(id: number | string) {
  try {
    const score = await getUserScore(id.toString());
    const balance = await getUserBalance(id.toString());
    await incrementScore(id, score);
    await setUserBalance(id, balance);
    await resetScore(id.toString());
  } catch (error: any) {
    throw new Error(`Failed to update score for user ${id}: ${error.message}`);
  }
}

export async function updateEraTotalScoreInDb() {
  try {
    const totalScore = await getTotalScoreCache();
    const currentEra = await getCurrentEra();
    if(currentEra) {
      await setEraTotal(currentEra.level, totalScore);
    }
  } catch (error: any) {
    throw new Error(`Failed to update score for Era `);
  }
}
