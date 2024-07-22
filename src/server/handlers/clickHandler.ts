import {
  getUserClicks,
  getUsersBoostsCache,
  incrementClickCount,
  incrementScore,
  incrementUserBalance,
  setUserClicks,
  setUserReamingClicks,
  setLastUpdateTime,
  getTotalScoreCache,
  incrementTotalScore,
  setUserTotalScoreCache,
  resetScore
} from '../../cache';
import { getUserTotalScore } from '../../service/main';
import { MAX_CLICKS_PER_DAY, MAX_CLICKS_PER_ERA, userSockets } from '../../utils/constants';
import { redis } from '../../utils/redis';
import { sendData } from './sendData';
import { getUserByUserId, resetDbScore } from '../../models/User';

let luaScriptSha1: string;

const luaScript = `
  local currentClicks = redis.call('hget', KEYS[1], ARGV[1]) or 0
  currentClicks = tonumber(currentClicks)
  local clickCount = tonumber(ARGV[3])
  local clickValue = tonumber(ARGV[4])
  if currentClicks < tonumber(ARGV[2]) then
    redis.call('hincrby', KEYS[1], ARGV[1], clickCount)
    redis.call('hincrby', 'user_scores', ARGV[1], clickCount * clickValue)
    redis.call('hincrby', 'user_total_score', ARGV[1], clickCount * clickValue)
    return 1 -- Indicate success
  else
    return 0 -- Indicate failure (max clicks reached)
  end
`;

// const luaScript = `
//   local clickCount = tonumber(ARGV[3])
//   local clickValue = tonumber(ARGV[4])
//   redis.call('hincrby', KEYS[1], ARGV[1], clickCount)
//   redis.call('hincrby', 'user_scores', ARGV[1], clickCount * clickValue)
//   redis.call('hincrby', 'user_total_score', ARGV[1], clickCount * clickValue)
//   return 1 -- Indicate success
//   end
// `;

const debugLuaScript = `
local currentClicks = redis.call('hget', KEYS[1], ARGV[1]) 


-- Debug: Return currentClicks as part of the script's output for debugging purposes
return {currentClicks, KEYS[1],ARGV[1], ARGV[2], ARGV[3]}
`;

async function loadLuaScript() {
  if (!luaScriptSha1) {
    luaScriptSha1 = (await redis.client.script('LOAD', luaScript)) as string;
  }
}

export async function handleUserClick(userId: string, clickCount: number, remaingClicks: number): Promise<void> {
  try {
    const boosts = await getUsersBoostsCache(userId);
    const clickValueBoost = boosts ? boosts.find((b: any) => b.type === 'tapAmount') : { level: 0 };
    const maxClicksBoost = boosts ? boosts.find((b: any) => b.type === 'maxClicks') : { level: 0 };
    const clickValue = 1 + (clickValueBoost?.level || 0);
    const maxClicks = MAX_CLICKS_PER_DAY + (maxClicksBoost?.level || 0) * 500;

    await loadLuaScript();
    const result = await redis.client.evalsha(
      luaScriptSha1,
      1,
      'user_clicks',
      'userId:' + userId,
      maxClicks,
      clickCount,
      clickValue
    );

    
    const totalScore = await getTotalScoreCache();
    if(totalScore + clickCount * clickValue > MAX_CLICKS_PER_ERA) {
      clickCount = MAX_CLICKS_PER_ERA - totalScore;
    }
    incrementUserBalance(userId, clickCount * clickValue);
    incrementTotalScore(clickCount * clickValue);
    setUserClicks(userId, clickCount * clickValue);
    setUserReamingClicks(userId, remaingClicks);
    setLastUpdateTime(userId);

    sendData(userId);
  } catch (e) {}
}

export async function handleClaim(userId: string): Promise<void> {
  try {
    setUserTotalScoreCache(userId, 0);
    resetScore(userId);
    resetDbScore(userId);
    sendData(userId);
  } catch (error) {}
}
