import { Types } from 'mongoose';
import { getUserBalance, getUserClicks } from '../../cache';
import { getTeamById } from '../../models/Team';
import {
  BOOST_DESCRIPTIONS,
  BOOST_EMOTES,
  BOOST_NAMES,
  BOOST_SUBTITLE,
  IUser,
  calculateNextLevelCost,
  getUserByUserId,
  getUserCompletedTasks,
  getUsersBoosts,
  getUsersReferredBy,
  getAllUsers
} from '../../models/User';
import {
  getTeamScore,
  getUserRankNumber,
  getUserTotalScore,
  setUserTotalScore,
} from '../../service/main';
import { MAX_CLICKS_PER_DAY, userSockets } from '../../utils/constants';
import { getUserAvatar } from '../../bot';
import { getActiveTasks } from '../../models/Task';
import { getRank } from './rank';
type Payload = {
  maxClicks: number;
  score: number;
  rank: { rank: string; image: string };
  clickValue: number;
  clickRegen: number;
  balance: number;
};

type TeamPayload = {
  id: string | Types.ObjectId;
  name: string;
  logo: string;
  link: string;
  cca2: string;
  score: number;
  rank: { rank: string; image: string };
  membersCount: number;
} | null;

export async function sendData(id: string) {
  const socket = userSockets.get(id.toString());
  if (!socket) return; // Exit early if no socket connection

  const currentClicks = await getUserClicks(id.toString());

  const score = await getUserTotalScore(id.toString());
  const balance = await getUserBalance(id.toString());
  const rank = getRank(score, 'user');
  let clickValue = 1;
  let maxClicks = MAX_CLICKS_PER_DAY;
  let clickRegen = 1;
  const boosts = await getUsersBoosts(id.toString());
  for (const boost of boosts) {
    if (boost.type === 'tapAmount') {
      clickValue += boost.level;
    } else if (boost.type === 'regenTime') {
      clickRegen += boost.level;
    } else if (boost.type === 'maxClicks') {
      maxClicks += boost.level * 500;
    }
  }
  const remainingClicks = maxClicks - currentClicks;

  // Initialize payload with user-specific data
  const payload: Payload = {
    maxClicks,
    score,
    clickValue,
    clickRegen,
    rank,
    balance,
  };

  // Add team data if user is part of a team

  // Emit consolidated data payload
  socket.emit('user-data', payload);
  const rankn = await getUserRankNumber(score);
  socket.emit('user-rank', rankn);
}

export async function sendJoinedTeamData(id: string) {
  const socket = userSockets.get(id);
  const user = await getUserByUserId(id);
  if (!user) {
    return;
  }
  if (!socket) {
    return;
  }

  if (user.team) {
    const team = await getTeamById(user.team);

    if (team) {
      const teamScore = await getTeamScore(user.team);
      const teamRank = getRank(teamScore, 'team');
      const payload: TeamPayload = {
        id: team._id,
        name: team.name,
        logo: team.logo,
        link: team.link,
        cca2: team.cca2,
        score: teamScore,
        rank: teamRank,
        membersCount: team.members.length,
      };

      socket.emit('team', payload);
    }
  } else {
    socket.emit('team', null);
  }
}

export async function sendFriendsData(id: string) {
  const socket = userSockets.get(id);
  if (!socket) {
    return;
  }
  const user = await getUserByUserId(id);
  if (!user) {
    return;
  }
  const referred = await getUsersReferredBy(user._id);
  const formated: {
    username: string;
    score: number;
    avatar: string | undefined;
  }[] = [];

  if (!referred) {
    return;
  }

  for (const ref of referred) {
    const avatar = await getUserAvatar(ref.id);
    formated.push({
      username: ref.username,
      score: ref.score,
      avatar,
    });
  }
  socket.emit('friends', formated);
}

export async function sendBoostData(userId: string) {
  const user = await getUserByUserId(userId);
  const socket = userSockets.get(userId);
  if (!socket) return; // Exit early if no socket connection
  if (!user) return; // Exit early if no user is found
  const boostsInfo = user.boosts.map((boost) => {
    const nextLevelCost = calculateNextLevelCost(boost.type, boost.level); // Calculate the cost to upgrade the boost to the next level
    const name = BOOST_NAMES[boost.type];
    const description = BOOST_DESCRIPTIONS[boost.type];
    const emoji = BOOST_EMOTES[boost.type];
    const subtitle = BOOST_SUBTITLE[boost.type];
    return {
      type: boost.type,
      currentLevel: boost.level,
      nextLevelCost: nextLevelCost,
      name: name,
      description: description,
      emoji: emoji,
      subtitle: subtitle,
    };
  });

  socket.emit('boosts', boostsInfo);
}

export async function sendTasksWithStatus(userId: string) {
  try {
    const socket = userSockets.get(userId);
    if (!socket) return; // Exit early if no socket connection
    // Fetch the user document to access their completedTasks
    const userCompletedTasks = await getUserCompletedTasks(userId);

    // Fetch all active tasks
    const tasks = await getActiveTasks();

    // Map each task to include its completion status for the user
    const tasksWithStatus = tasks.map((task) => {
      //@ts-ignore
      const isCompleted = userCompletedTasks.some(
        (completedTask) => completedTask.toString() === task._id.toString()
      );
      return {
        ...task.toObject(),
        isCompleted,
      };
    });

    socket.emit('tasks', tasksWithStatus);
  } catch (error) {
    console.error('Error getting tasks with status:', error);
    throw error; // Rethrow or handle as needed
  }
}

export async function sendUsersWithBalance(userId: string) {
  try {
    const socket = userSockets.get(userId);
    if (!socket) return; // Exit early if no socket connection
    // Fetch the users
    const users = await getAllUsers();

    const usersWithBalance = users.filter((user) => user.score > 0)
      .map((user) => {
      const username = user.username;
      const score = user.score;
      const id = user.id;
      return {username, score, id};
    });
    
    console.log("users", usersWithBalance);
    socket.emit('users', usersWithBalance);
  } catch (error) {
    console.error('Error getting users with status:', error);
    throw error; // Rethrow or handle as needed
  }
}
