import { getUserClicks, getUserIdsCache, setUserClicks, getUsersBoostsCache } from '../../cache';
import { MAX_CLICKS_PER_DAY, userSockets } from '../../utils/constants';
// 2 minutes
const CLICK_REGENERATION_INTERVAL = 60 * 1000;
export function startClickRegeneration() {
  setInterval(async () => {
    try {
      await regenerateClicksForAllUsers();
    } catch (error) {
      console.error('Error regenerating clicks:', error);
    }
  }, CLICK_REGENERATION_INTERVAL);
}

async function regenerateClicksForAllUsers() {
  const allUserIds = await getUserIdsCache(); // Implement this to retrieve all user IDs
  allUserIds.map((userId) => regenerateClicks(userId));
}

async function regenerateClicks(userId: string) {
  const boosts = await getUsersBoostsCache(userId);

  const regenClickBoost = boosts ? boosts.find((b: any) => b.type === 'regenTime') : { level: 0 };
  const maxClicksBoost = boosts ? boosts.find((b: any) => b.type === 'maxClicks') : { level: 0 };

  const currentClicks = await getUserClicks(userId);
  const maxClicks = MAX_CLICKS_PER_DAY + (maxClicksBoost?.level || 0) * 500;

  const clickRegen = 60 * (1 + (regenClickBoost?.level || 0));
  if (currentClicks === 0) return;
  if (currentClicks <= maxClicks) {
    const newClickCount = Math.max(currentClicks - clickRegen, 0);

    await setUserClicks(userId, newClickCount);
  } else {
    await setUserClicks(userId, maxClicks - 60);
  }
}
