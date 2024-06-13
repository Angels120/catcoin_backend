import { getTeamById, getTeamByMembersDesc, getTeamByName, searchTeam } from '../../models/Team';
import { addUserToTeam, getTeamScore, removeUserFromTeam } from '../../service/main';
import { userSockets } from '../../utils/constants';
import { getRank } from './rank';
import { sendData, sendJoinedTeamData } from './sendData';

export async function sendTeamsData(id: string) {
  const socket = userSockets.get(id);
  if (!socket) {
    return;
  }
  const teams = await getTeamByMembersDesc();
  const teamsWithScore = await Promise.all(
    teams.map(async (team) => {
      const score = await getTeamScore(team._id);
      return {
        id: team._id,
        name: team.name,
        logo: team.logo,
        link: team.link,
        cca2: team.cca2,
        score,
        rank: getRank(score, 'team'),
        membersCount: team.membersCount,
      };
    })
  );

  socket.emit('teams-data', teamsWithScore);
}

export async function handleTeamSearch(searchTerm: string, id: string) {
  const socket = userSockets.get(id);
  if (!socket) {
    return;
  }
  const teams = await searchTeam(searchTerm);
  socket.emit('teams-data', teams);
}

export async function getSingleTeam(id: string, teamId: string) {
  const socket = userSockets.get(id);
  if (!id || !teamId) {
    return;
  }
  if (!socket) {
    return;
  }
  const team = await getTeamById(teamId);
  const score = await getTeamScore(teamId);

  socket.emit('team-single', {
    id: team?._id,
    name: team?.name,
    logo: team?.logo,
    link: team?.link,
    cca2: team?.cca2,
    score: score,
    rank: getRank(score, 'team'),
    membersCount: team?.members.length,
  });
}

export async function handleJoinTeam(id: string, teamId: string) {
  const socket = userSockets.get(id);
  if (!id || !teamId) {
    return;
  }
  if (!socket) {
    return;
  }
  const team = await getTeamById(teamId);

  if (!team) {
    return;
  }
  await addUserToTeam(id, teamId);
  sendJoinedTeamData(id);
}

export async function handleLeaveTeam(id: string) {
  const socket = userSockets.get(id);
  if (!socket) {
    return;
  }
  await removeUserFromTeam(id);
  sendJoinedTeamData(id);
}
