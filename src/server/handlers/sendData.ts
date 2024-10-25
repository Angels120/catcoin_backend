import { Types } from 'mongoose';
import { getUserBalance, getUserClicks, getUserReamingClicks, getLastUpdateTime, getAllUserScoresFromRedis, setTotalScoreCache, getTotalScoreCache, setUserTotalScoreCache, getReviewFlagCache, getHalvingFlagCache } from '../../cache';
import { getTeamById } from '../../models/Team';
import { getCurrentEra, getTotalScore, setStartDate, updateLevel } from '../../models/Era';
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
  getAllUsers,
  fetchUsers,
  getTotalUsersLength,
  getPlayersCountForLast8Weeks
} from '../../models/User';
import {
  getTeamScore,
  getUserRankNumber,
  getUserTotalScore,
  setUserTotalScore,
} from '../../service/main';
import { MAX_CLICKS_PER_DAY, userSockets, MAX_CLICKS_PER_ERA, HALVING_PERIOD } from '../../utils/constants';
import { getUserAvatar } from '../../bot';
import { getActiveTasks } from '../../models/Task';
import { getRank } from './rank';
import { getLastThreeUsers } from '../../models/Statistics';
type Payload = {
  maxClicks: number;
  score: number;
  rank: { rank: string; image: string };
  clickValue: number;
  clickRegen: number;
  balance: number;
};

type eraPayload = {
  level: number;
  description: string;
  salo: number;
  rate: number;
  totalScore: number;
  isActive: boolean;
  period?:number;
  type?:string;
}

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

function getDifferenceInSeconds(date1: Date, date2: Date): number {
  const diffInMilliseconds = date2.getTime() - date1.getTime();
  const diffInSeconds = diffInMilliseconds / 1000;
  return diffInSeconds;
}

export async function sendData(id: string) {
  const socket = userSockets.get(id.toString());
  if (!socket) return; // Exit early if no socket connection

  const currentClicks = await getUserClicks(id.toString());

  const score = await getUserTotalScore(id.toString());
  console.log("send score: ", score);
  const balance = await getUserBalance(id.toString());
  const rank = getRank(score, 'user');
  const era = await getCurrentEra();
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
  const totalScore = await getTotalScoreCache();
  console.log("total Score", totalScore);

  if(era){
    if(era.startDate != null) {
      const currentDate = new Date();
      let period = 0;
      let type = ''
      if(era.middleDate > currentDate) {
        period =  getDifferenceInSeconds(currentDate, era.middleDate);
        type = 'review'
      } else {
        period =  getDifferenceInSeconds(currentDate, era.endDate);
        type = 'halving'
      }
      
      maxClicks = era.salo;
      const eraData: eraPayload = {
        totalScore,
        level : era.level,
        rate : era.rate,
        salo : era.salo,
        description : era?.description,
        isActive: false,
        period : period,
        type: type
      };
      socket.emit('era-data', eraData);
    }
    else {
      maxClicks = era.salo;
      const eraData: eraPayload = {
        totalScore,
        level : era.level,
        rate : era.rate,
        salo : era.salo,
        description : era?.description,
        isActive: true
      };
      socket.emit('era-data', eraData);
    }
  }
  

  // Initialize payload with user-specific data
  const payload: Payload = {
    maxClicks,
    score,
    clickValue,
    clickRegen,
    rank,
    balance,
  };



  // Emit consolidated data payload
  socket.emit('user-data', payload);
  // const rankn = await getUserRankNumber(score);
  const review_flag = await getReviewFlagCache();
  const halving_flag = await getHalvingFlagCache();
  // socket.emit('user-rank', rankn);
}

export async function sendRemainingClicks(id: string) {
  const socket = userSockets.get(id.toString());
  if (!socket) return; // Exit early if no socket connection

  const remainingClicks = await getUserReamingClicks(id.toString());
  const last_update_time = await getLastUpdateTime(id.toString());
  const currentClicks = await getUserClicks(id.toString());
  const currentTime = Date.now().toString();
  let sendRemainingClicks = 0;
  const era = await getCurrentEra();
  if(era){
    if(last_update_time == "0"){
      sendRemainingClicks = era.salo;
    }
    else {
  
      const date1 = new Date(last_update_time);
      const date2 = new Date(currentTime);
      console.log("last_update: ", last_update_time);
      console.log("current: ", currentTime);
      
      const differenceInSeconds = (parseInt(currentTime) - parseInt(last_update_time)) / 1000;
      const temp = remainingClicks - currentClicks + ( differenceInSeconds / era.rate );
      console.log("remaing temp", differenceInSeconds);
      sendRemainingClicks = Math.min(Math.round(temp), era.salo);
      // Calculate the difference in milliseconds and convert to seconds
      
    }
    console.log("Reaminig Clicks: ", sendRemainingClicks);
    socket.emit('init-remaingClicks', sendRemainingClicks);
  }
  
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

export async function sendUsersWithBalance(userId: string, start: number, limit: number) {
  try {
    const socket = userSockets.get(userId);
    if (!socket) return; // Exit early if no socket connection
    // Fetch the users
    const users = await fetchUsers(start, limit);

    const usersWithBalance : {
      username: string;
      id : number;
      score : number;
      avatar : string | undefined;
    }[] = [];

    for(const user of users) {
      const avatar = await getUserAvatar(user.id);
      usersWithBalance.push({
        username : user.username,
        id : user.id,
        score : user.score,
        avatar
      });
    }
    // const usersWithBalance = users.filter((user) => user.score > 0)
    //   .map((user) => {
    //   const username = user.username;
    //   const score = user.score;
    //   const id = user.id;
    //   const avatar = getUserAvatar(id);
    //   return {username, score, id, avatar};
    // });
    socket.emit('users', usersWithBalance);
  } catch (error) {
    console.error('Error getting users with status:', error);
    throw error; // Rethrow or handle as needed
  }
}

export async function sendTotalUsers(userId: string) {
  try {
    const socket = userSockets.get(userId);
    const totalUsers = await getTotalUsersLength();
    socket?.emit('total', totalUsers);
  } catch (error) {
    console.error('Error getting totalUsers Length:', error);
    throw error; // Rethrow or handle as needed
  }
  
}

export async function sendTotalScore(userId: string) {
  try {
    const socket = userSockets.get(userId);
    const totalScore = await getTotalScore();
    socket?.emit('totalScore', totalScore);
  } catch (error) {
    console.error('Error getting totalUsers Length:', error);
    throw error; // Rethrow or handle as needed
  }
  
}


export async function sendMonthlyUsers(userId: string) {
  try {
    const socket = userSockets.get(userId);
    const monthlyUsers = await getLastThreeUsers();
    socket?.emit('monthly', monthlyUsers);
  } catch (error) {
    console.error('Error getting MonthlyUsers Length:', error);
    throw error; // Rethrow or handle as needed
  }
  
}

export async function sendActiveUsers() {
  try {
    const activeUsers = userSockets.size;
    userSockets.forEach((socket, userId) => {
      socket.emit('active', activeUsers);
    });
  } catch (error) {
    
  }
}

export async function sendChartData(userId: string) {
  try {
    const socket = userSockets.get(userId);
    const chartData = await getPlayersCountForLast8Weeks();
    socket?.emit('chartData', chartData);
  } catch (error) {
    console.error('Error getting chartData:', error);
    throw error; // Rethrow or handle as needed
  }
  
}