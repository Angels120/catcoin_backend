import { Server, createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { userSockets } from '../utils/constants';
import { BoostType, getTopUsersWithNonZeroScoreWithTeam, getUserByUserId } from '../models/User';
import { logUserInteraction, getMonthlyUsers } from '../models/Statistics';
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
import { updateSingleUserScoreInDb } from './handlers/batchScoreUpdate';
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
  sendTotalUsers
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
import { setUserBalance, setUserBoostsCache } from '../cache';
import { handleAffiliate } from './handlers/affiliate';

const token = env['BOT_TOKEN'];
const port = env['PORT'] || 3001;

const httpServer = createServer(async (req, res) => {
  var url = req.url;
  res.setHeader('Content-Type', 'application/json');

  if (url?.includes('/getUpdates')) {
    revalidateCache();
    res.write(JSON.stringify({ status: 'ok' }));
    res.end();
  } else if (url?.includes('/top10TeamsExpensive')) {
    const result = await top10TeamsExpensive();
    res.write(JSON.stringify(result));

    res.end();
  } else if (url?.includes('/getTopUsersWithNonZeroScore')) {
    const limit = url.split('/')[2];
    const teamId = url.split('/')[3];
    const result = await getTopUsersWithNonZeroScoreWithTeam(Number(limit), teamId);
    res.write(JSON.stringify(result));
    res.end();
  } else if (url?.includes('/getTop10Teams')) {
    const result = await getTop10Teams();
    res.write(JSON.stringify(result));
    res.end();
  } else if (url?.includes('/handleAffiliate')) {
    const user = url.split('/')[3];
    const referralId = url.split('/')[4];
    console.log(url);
    console.log("user:", user, "referral:", referralId);
    handleAffiliate(Number(user), Number(referralId));
    res.write(JSON.stringify({ status: 'ok' }));
    res.end();
  }
});

const io = new SocketIOServer(httpServer, {
  cors: {
    // origin: "*", // Allow your client URL
    origin: env['GAME_URL'], // Allow your client URL
    methods: ['GET', 'POST'],
  },
});

const broadcastActiveUsersCount = () => {
  const activeUsersCount = userSockets.size; // Count the number of active sockets
  io.emit('active', activeUsersCount); // Send the count to all users
};

io.on('connection', async (socket: Socket) => {
  console.log("connected");
  const id = socket.handshake.query.id as string;
  const data = socket.handshake.query.data as string;

  if (!verifyTelegramData(data)) {
    socket.disconnect();
    return;
  }

  const user = await getUserByUserId(id);
  if (!user) {
    //send user not found
    socket.emit('user-not-found');
    socket.disconnect();
    return;
  }

  userSockets.set(id, socket);
  console.log(userSockets.get(""));
  
  await logUserInteraction(id);
  // await sendActiveUsers();
  broadcastActiveUsersCount();
  await sendMonthlyUsers(id);
  await sendTotalUsers(id);
  //setting total score to cache
  await updateSingleUserScoreInDb(id);
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
