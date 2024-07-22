import { clearInterval } from 'node:timers';
import { getUserClicks, getUserIdsCache, setUserClicks, getUsersBoostsCache, getTotalScoreCache, setTotalScoreCache, setUserTotalScoreCache } from '../../cache';
import { getCurrentEra, setStartDate, updateLevel } from '../../models/Era';
import { getAllUsers } from '../../models/User';
import { HALVING_PERIOD, MAX_CLICKS_PER_DAY, MAX_CLICKS_PER_ERA, userSockets } from '../../utils/constants';
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

export function monitorTotalScore() {
  const monitor = setInterval(async () => {
    try {
      const totalScore = await getTotalScoreCache();
      console.log("monitor: ", totalScore);
      if(totalScore >= MAX_CLICKS_PER_ERA){
        clearInterval(monitor);
        const era = await getCurrentEra();
        if(era){
          await setStartDate(era.level, new Date());
          setTimeout(async () => {
            await updateLevel();
            
            const users = await getAllUsers();
            for(const user of users){
              await setUserTotalScoreCache(user.id.toString(), 0);
              console.log(user.id);
            }
            await setTotalScoreCache(0);
            monitorTotalScore();
          }, HALVING_PERIOD * 1000);
        }
      }
    }
    catch (error) {
      console.log("Monitoring Error : ", error);
    }
  }, 1000);
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
