import { escapers } from '@telegraf/entity';
import { MyContext } from '../bot/types';
import {
  getAllUserTotalScoresCache,
  getTop10teamsCache,
  getUserBalance,
  getUserTotalScoreCache,
  incrementScore,
  incrementUserBalance,
  setTop10teamsCache,
  setUserBoostsCache,
  setUserIdsCache,
  setUserTotalScoreCache,
  setTotalScoreCache
} from '../cache';
import {
  addCompletedTask,
  calculateNextLevelCost,
  getAllUsers,
  getReferralCount,
  getUserByTeamId,
  getUserByUserId,
  setUserTeam,
} from '../models/User';
import { ethers } from 'ethers';
import { addMemberToTeam, getAllTeams, removeMemberFromTeam } from '../models/Team';
import { Types } from 'mongoose';
import { validate } from 'multicoin-address-validator';
import { sendBoostData, sendData, sendTasksWithStatus } from '../server/handlers/sendData';
import { getTaskById } from '../models/Task';
import { checkUserHasJoinedChat, sendMessage } from '../bot';
import { InlineKeyboard, Keyboard } from 'grammy';
import { env } from 'process';
import dotenv from 'dotenv';
import { checkNft, getBalance } from './web3';
dotenv.config();

export type Events = 'invite';
const GROUP_CHAT_ID = env['GROUP_CHAT_ID'];
const GROUP_CHAT_ID_2 = env['GROUP_CHAT_ID_2'];

export async function handleBotEvent(event: Events, userId: number) {
  try {
    switch (event) {
      case 'invite':
        getAffiliateLinkWithoutContext(userId);
      default:
        break;
    }
  } catch (e) {}
}

export async function revalidateCache() {
  //get all users
  const users = await getAllUsers();
  const userIds = users.map((user) => user.id.toString());
  setUserIdsCache(userIds);
}

export async function buyBoost(userId: string, boostType: string) {
  const user = await getUserByUserId(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }
  const boost = user.boosts.find((b) => b.type === boostType);

  if (!boost) {
    // If the user doesn't have this boost, throw an error
    throw new Error(`Boost not found: ${boostType}`);
  }

  const level = boost ? boost.level : 1;

  const cost = calculateNextLevelCost(boost.type, level);
  const balance = await getUserBalance(userId);

  // if (balance >= cost) {
  // await incrementUserBalance(userId, -cost); // Decrement the user's score
  if (boost) boost.level += 1; // Increment the boost level

  await user.save();
  setUserBoostsCache(userId, user.boosts);
  sendBoostData(userId);
  sendData(userId);
  // Notify the user of successful purchase
  // }
}

export async function checkTaskCompletion(userId: string, taskId: string) {
  try {
    const user = await getUserByUserId(userId);
    const task = await getTaskById(taskId);
    if (!user || !task) {
      return;
    }

    // Check if the task is already completed
    if (user.completedTasks.includes(task._id)) {
      return true; // Task is already completed
    }

    let isCompleted = false;

    switch (task.conditionType) {
      case 'joinGroup':
        isCompleted = (await checkUserJoinGroup(user.id)) ?? false;
        break;
      case 'joinGroup2':
        isCompleted = (await checkUserJoinGroup2(user.id)) ?? false;
        break;
      case 'link':
        isCompleted = true;
        break;
      case 'invites':
        const count = await getReferralCount(user._id);
        if (!count) return;
        isCompleted = count >= task.conditionValue;
        break;
      case 'hold':
        if (!user.address) return;

        const check = await checkNft(user.address, task.conditionValue);

        isCompleted = check;
        break;

      case 'joinTeam':
        isCompleted = !!user.team;
        break;
      default:
        break;
    }

    if (isCompleted) {
      // Reward the user

      await incrementScore(user.id, task.reward);
      await incrementUserBalance(user.id, task.reward);

      // Mark the task as completed
      user.completedTasks.push(task._id);
      await user.save();
    }

    sendTasksWithStatus(userId);
    sendData(userId);
  } catch (e) {}
}

const checkUserJoinGroup = async (userId: number) => {
  if (!userId) return;
  if (!GROUP_CHAT_ID) return;
  const hasJoined = await checkUserHasJoinedChat(userId, Number(GROUP_CHAT_ID));
  return hasJoined;
};

const checkUserJoinGroup2 = async (userId: number) => {
  if (!userId) return;
  return true;
  if (!GROUP_CHAT_ID_2) return;
  const hasJoined = await checkUserHasJoinedChat(userId, Number(GROUP_CHAT_ID_2));
  return hasJoined;
};

export async function setUserTotalScore(id: number | string) {
  // Get the current score from the main database
  const user = await getUserByUserId(id);
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  const score = user.score;
  await setUserTotalScoreCache(id.toString(), score);
  return score;
}

export async function setTotalScore() {
  const allUserstotalScore = await getAllUserTotalScoresCache();
  const totalScores = Object.values(allUserstotalScore);
  let totalScore = 0;
  for (const score of totalScores){
    const temp = parseInt(score);
    totalScore += temp;
  }
  await setTotalScoreCache(totalScore);
}

export async function getUserRankNumber(score: number) {
  try {
    const allUsersScore = await getAllUserTotalScoresCache();
    const sortedScores = Object.values(allUsersScore)
      .map((score) => parseInt(score))
      .sort((a, b) => b - a);
    const rank = sortedScores.indexOf(score) + 1;
    return rank;
  } catch (e) {
    return 0;
  }
}

export async function getUserTotalScore(id: number | string) {
  // Get the total score from Redis
  const score = await getUserTotalScoreCache(id.toString());
  return score;
}

export const getAffiliateLink = async (ctx: MyContext) => {
  const userId = ctx.from?.id;
  if (!userId) {
    return false;
  }
  const affiliateUser = await getUserByUserId(userId);

  if (!affiliateUser) {
    await ctx.reply('❌ Internal error, please try again later', {
      parse_mode: 'MarkdownV2',
    });
    return false;
  }
  const link = `https://t.me/RecaTapperBot?start=ref_${affiliateUser.id}`;
  const msg = `🎁 +500 coins as a first-time gift`;
  const keyboard = new InlineKeyboard().url(
    'Invite friends',
    `https://t.me/share/url?url=${link}&text=${msg}`
  );
  await ctx.reply(
    `Invite your friends and get bonuses for each invited friend\\! 🎁

Your referral link: \`${escapers.MarkdownV2(link)}\``,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard,
    }
  );
  return true;
};

export const getAffiliateLinkWithoutContext = async (userId: number) => {
  const affiliateUser = await getUserByUserId(userId);

  if (!affiliateUser) {
    return false;
  }
  const link = `https://t.me/RecaTapperBot?start=ref_${affiliateUser.id}`;
  const msg = `🎁 +500 coins as a first-time gift`;
  const keyboard = new InlineKeyboard()
    .url('Invite friends', `https://t.me/share/url?url=${link}&text=${msg}`)
    .webApp('go back to game', `${env['GAME_URL']}/play`);
  await sendMessage(
    userId,
    `Invite your friends and get bonuses for each invited friend\\! 🎁

Your referral link: \`${escapers.MarkdownV2(link)}\``,
    keyboard
  );
};

export function isAddressValid(address: string) {
  try {
    const addressRegex = /^[\S]{48}$/;

    return addressRegex.test(address);
  } catch (e) {
    return false;
  }
}

export async function getUserScore(dbUserId: number) {
  const score = await getUserTotalScore(dbUserId);
  return score;
}

export async function addUserToTeam(id: string, team: string) {
  try {
    const user = await getUserByUserId(id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }
    await setUserTeam(id, team);
    await addMemberToTeam(team, user._id);
    return true;
  } catch (e) {
    return false;
  }
}

export async function removeUserFromTeam(id: number | string) {
  try {
    const user = await getUserByUserId(id);
    if (!user || !user.team) {
      throw new Error(`User not found: ${id}`);
    }
    await setUserTeam(id, null);
    await removeMemberFromTeam(user.team, user._id);
    return true;
  } catch (e) {
    return false;
  }
}

export async function getTeamScore(teamId: string | Types.ObjectId) {
  const teamMembers = await getUserByTeamId(teamId);
  if (!teamMembers) {
    return 0;
  }
  const scorePromises = teamMembers.map((member) => getUserScore(member.id));
  const scores = await Promise.all(scorePromises);
  const totalScore = scores.reduce((a, b) => a + b, 0);
  return totalScore;
}

export async function top10TeamsExpensive() {
  const teams = await getAllTeams();
  const promises = teams.map(async (team) => {
    const score = await getTeamScore(team._id);
    return {
      id: team._id,
      name: team.name,
      score,
    };
  });
  const scores = await Promise.all(promises);
  const sortedScores = scores.sort((a, b) => b.score - a.score);
  const top10 = sortedScores.slice(0, 10);
  return top10;
}

export async function getTop10Teams() {
  const top10Cache = await getTop10teamsCache();
  if (top10Cache) {
    return top10Cache;
  }
  const top10 = await top10TeamsExpensive();
  await setTop10teamsCache(top10);

  return top10;
}
