import { Server, createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer, Socket } from 'socket.io';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';

import { userSockets } from '../utils/constants';
import { BoostType, getTopUsersWithNonZeroScoreWithTeam, getUserByUserId } from '../models/User';
import { logUserInteraction } from '../models/Statistics';
import {
  Events,
  buyBoost,
  checkTaskCompletion,
  getTop10Teams,
  handleBotEvent,
  revalidateCache,
  setUserTotalScore,
  setTotalScore,
  top10TeamsExpensive,
} from '../service/main';
import { handleUserClick, handleClaim } from './handlers/clickHandler';
import { updateEraTotalScoreInDb, updateSingleUserScoreInDb } from './handlers/batchScoreUpdate';
import {
  sendRemainingClicks,
  sendBoostData,
  sendData,
  sendFriendsData,
  sendJoinedTeamData,
  sendTasksWithStatus,
  sendUsersWithBalance,
  sendActiveUsers,
  sendMonthlyUsers,
  sendTotalUsers,
  sendChartData,
  sendTotalScore
} from './handlers/sendData';
import { env } from 'process';
import {
  getSingleTeam,
  handleJoinTeam,
  handleLeaveTeam,
  handleTeamSearch,
  sendTeamsData,
} from './handlers/teams';
import { createHmac } from 'crypto';
import { validate } from '@tma.js/init-data-node';
import { getOnlineUsersCache, incrementOnlineUsers, setUserBalance, setUserBoostsCache } from '../cache';
import { handleAffiliate } from './handlers/affiliate';

const token = env['BOT_TOKEN'];
const port = env['PORT'] || 3001;

const app = express();
const httpServer = createServer(app);
app.use(cors());
app.use(express.json());

app.use('/api/admin', adminRouter);

// Auth route for admin login
app.use('/api/auth', authRouter);

const io = new SocketIOServer(httpServer, {
  cors: {
    // origin: "*", // Allow your client URL
    origin: env['GAME_URL'], // Allow your client URL
    methods: ['GET', 'POST'],
  },
});
const broadcastActiveUsersCount = async () => {
  const activeUsers = await getOnlineUsersCache();
  // const activeUsers = userSockets.size;
  console.log("acitve users: ", activeUsers);
  io.emit('active', activeUsers); // Send the count to all users
};

export const broadcastEndHalving = () => {
  io.emit('end_halving'); // Send the count to all users
};

export const broadcastStartHalving = () => {
  io.emit('start_halving'); // Send the count to all users
};

io.on('connection', async (socket: Socket) => {
  console.log("connected");
  const id = socket.handshake.query.id as string;
  const data = socket.handshake.query.data as string;

  if (!verifyTelegramData(data)) {
    socket.disconnect();
    console.log("disconnected");
  return;
  }

  const user = await getUserByUserId(id);
  if (!user) {
    //send user not found
    socket.emit('user-not-found');
    socket.disconnect();
    console.log("disconnected");
    return;
  }

  userSockets.set(id, socket);
  await incrementOnlineUsers(1);
  await logUserInteraction(id);
  // await sendActiveUsers();
  broadcastActiveUsersCount();
  await sendChartData(id);
  await sendMonthlyUsers(id);
  await sendTotalUsers(id);
  await sendTotalScore(id);
  //setting total score to cache
  await updateSingleUserScoreInDb(id);
  await updateEraTotalScoreInDb();
  await setUserTotalScore(user.id);
  await setUserBalance(user.id, user.balance);
  await sendData(id);
  await sendRemainingClicks(id);
  await sendJoinedTeamData(id);
  // await setUserBoostsCache(user.id, user.boosts);

  socket.on('disconnect', async () => {
    try {
      await updateSingleUserScoreInDb(id);

      userSockets.delete(id);
      console.log("disconnected");
      await incrementOnlineUsers(-1);
      // await sendActiveUsers();
      broadcastActiveUsersCount();
    } catch (error) {}
  });

  socket.on('click', (clickCount: number, remaingClicks: number) => {
    try {
      handleUserClick(id, clickCount, remaingClicks);
    } catch (error) {}
  });

  socket.on('claim', () => {
    try {
      handleClaim(id);
    } catch (error) {}
  })

  socket.on('teams-data', () => {
    try {
      sendTeamsData(id);
    } catch (error) {}
  });

  socket.on('team-search', (searchTerm: string) => {
    try {
      handleTeamSearch(searchTerm, id);
    } catch (error) {}
  });

  socket.on('team-single', (teamId: string) => {
    try {
      getSingleTeam(id, teamId);
    } catch (error) {}
  });

  socket.on('join-team', (teamId: string) => {
    try {
      handleJoinTeam(id, teamId);
    } catch (error) {}
  });

  socket.on('leave-team', () => {
    try {
      handleLeaveTeam(id);
    } catch (error) {}
  });

  socket.on('friends', () => {
    try {
      sendFriendsData(id);
    } catch (error) {}
  });

  socket.on('boosts', () => {
    try {
      sendBoostData(id);
    } catch (error) {}
  });

  socket.on('buy-boost', (type: BoostType) => {
    try {
      buyBoost(id, type);
    } catch (error) {}
  });

  socket.on('tasks', async () => {
    try {
      sendTasksWithStatus(id);
    } catch (error) {}
  });

  socket.on('users', async (start: number, limit: number) => {
    try {
      console.log("trying fetch users:", start, ", ", limit);
      sendUsersWithBalance(id, start, limit);
    } catch (error) {}
  });
  

  socket.on('check-task', async (taskId: string) => {
    try {
      checkTaskCompletion(id, taskId);
    } catch (error) {}
  });

  socket.on('bot-event', async (event: Events) => {
    try {
      handleBotEvent(event, Number(id));
    } catch (error) {}
  });
});

export function startServer() {
  httpServer.listen(port, () => {
    console.log(`listening on *:${port}`);
  });
}

function verifyTelegramData(dataCheckString: string): boolean {
  try {
    validate(dataCheckString, token!);
    return true;
  } catch (e) {
    return false;
  }
}
