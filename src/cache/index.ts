import { ITeam } from '../models/Team';
import { redis } from '../utils/redis';

export async function incrementScore(userId: string, incrementAmount: number) {
  redis.client.hincrby('user_scores', `userId:${userId}`, incrementAmount);
  redis.client.hincrby('user_total_score', `userId:${userId}`, incrementAmount);
}

export async function resetScore(userId: string) {
  redis.client.hset('user_scores', `userId:${userId}`, 0);
}

export async function getAllUserScoresFromRedis() {
  const scores = await redis.client.hgetall('user_scores');
  const nonZeroScores = Object.entries(scores).filter(([_, value]) => parseInt(value) !== 0);
  return Object.fromEntries(nonZeroScores);
}

export async function getUserScore(userId: string | number) {
  const score = await redis.client.hget('user_scores', `userId:${userId}`);
  return score ? parseInt(score) : 0;
}

export async function getUserClicks(userId: string) {
  const clicks = await redis.client.hget('user_clicks', `userId:${userId}`);
  return clicks ? parseInt(clicks) : 0;
}

export async function setUserClicks(userId: string, ammount: number) {
  redis.client.hset('user_clicks', `userId:${userId}`, ammount);
}

export async function getUserReamingClicks(userId: string) {
  const remaining_clicks = await redis.client.hget('remaining_clicks', `userId:${userId}`);
  return remaining_clicks ? parseInt(remaining_clicks) : 0;
}

export async function setUserReamingClicks(userId: string, amount:number) {
  const clicks = await redis.client.hset('remaining_clicks', `userId:${userId}`, amount);
}

export async function getLastUpdateTime(userId: string) {
  const last_update_time = await redis.client.hget('last_update_time', `userId:${userId}`);
  return last_update_time ? last_update_time.toString() : "0";
}

export async function setLastUpdateTime(userId: string,) {
  const currentTime = Date.now().toString();
  const last_update_time = await redis.client.hset('last_update_time', `userId:${userId}`, currentTime);
}

export async function incrementClickCount(userId: string, incrementAmount: number) {
  redis.client.hincrby('user_clicks', `userId:${userId}`, incrementAmount);
}

export async function incrementUserBalance(userId: string, incrementAmount: number) {
  redis.client.hincrby('user_balance', `userId:${userId}`, incrementAmount);
}
export async function incrementTotalScore(incrementAmount: number) {
  redis.client.incrby('total_score', incrementAmount);
}

export async function setUserBalance(userId: string, balance: number) {
  redis.client.hset('user_balance', `userId:${userId}`, balance);
}

export async function getUserBalance(userId: string) {
  const balance = await redis.client.hget('user_balance', `userId:${userId}`);
  return balance ? parseInt(balance) : 0;
}

export async function getAllUserBalancesFromRedis() {
  const balances = await redis.client.hgetall('user_balance');
  const nonZeroBalances = Object.entries(balances).filter(([_, value]) => parseInt(value) !== 0);
  return Object.fromEntries(nonZeroBalances);
}

export async function setUserTotalScoreCache(userId: string, score: number) {
  redis.client.hset('user_total_score', `userId:${userId}`, score);
}

export async function setTotalScoreCache(totalScore: number) {
  redis.client.set('total_score', totalScore);
}

export async function resetTotalScoreCache() {
  redis.client.set('total_score', 0);
}

export async function getTotalScoreCache() {
  const totalScore = redis.client.get('total_score');
  return totalScore !== null ? parseInt(totalScore.toString(), 10) : 0;
}


export async function getUserTotalScoreCache(userId: string) {
  const score = await redis.client.hget('user_total_score', `userId:${userId}`);
  return score ? parseInt(score) : 0;
}
export async function getAllUserTotalScoresCache() {
  const scores = await redis.client.hgetall('user_total_score');
  const nonZeroScores = Object.entries(scores).filter(([_, value]) => parseInt(value) !== 0);
  return Object.fromEntries(nonZeroScores);
}

export async function setUserIdsCache(userIds: string[]) {
  redis.client.sadd('user_ids', userIds);
}

export async function getUserIdsCache() {
  const userIds = await redis.client.smembers('user_ids');
  return userIds;
}

export async function setTop10teamsCache(teams: Array<{ score: number; name: string }>) {
  const teamsString = JSON.stringify(teams);
  redis.client.set('top10_teams', teamsString, 'EX', 60 * 5);
}

export async function getTop10teamsCache(): Promise<Array<{
  score: number;
  name: string;
}> | null> {
  const teams = await redis.client.get('top10_teams');
  return teams ? JSON.parse(teams) : null;
}

export async function getUsersBoostsCache(userId: string) {
  const boosts = await redis.client.get(`user_boosts:${userId}`);
  return boosts ? JSON.parse(boosts) : null;
}

export async function setUserBoostsCache(
  userId: string,
  boosts: Array<{ type: string; level: number }>
) {
  await redis.client.set(`user_boosts:${userId}`, JSON.stringify(boosts));
}
