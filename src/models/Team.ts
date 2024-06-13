import { Schema, model, Types } from 'mongoose';

export interface ITeam {
  _id: Types.ObjectId | string;
  name: string;
  cca2: string;
  logo: string;
  link: string;
  members: Types.ObjectId[];
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    members: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
    cca2: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
teamSchema.index({ name: 1, cca2: 1 }, { unique: true });
const Team = model<ITeam>('Team', teamSchema);

export function isTeamExist(name: string) {
  return Team.exists({ name });
}

export function atLeastOneTeamExist() {
  return Team.find({});
}

export const searchTeam = async (searchTerm: string) => {
  return await Team.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { cca2: { $regex: searchTerm, $options: 'i' } },
    ],
  }).limit(10);
};

export function createTeam({
  name,
  logo,
  link,
  cca2,
}: {
  name: string;
  logo: string;
  link: string;
  cca2: string;
}) {
  return Team.create({
    name,
    logo,
    link,
    cca2,
  });
}

export function getAllTeams() {
  return Team.find();
}

export function getTeamByName(name: string) {
  return Team.findOne({ name });
}

export function getTeamById(id: string | Types.ObjectId) {
  return Team.findById(id);
}

export function addMemberToTeam(teamId: string, userId: string | Types.ObjectId) {
  return Team.findByIdAndUpdate(teamId, { $push: { members: userId } });
}

export function removeMemberFromTeam(
  teamId: string | Types.ObjectId,
  userId: string | Types.ObjectId
) {
  return Team.findByIdAndUpdate(teamId, { $pull: { members: userId } });
}

export function getTeamByMembersDesc() {
  return Team.aggregate([
    {
      $project: {
        name: 1,
        logo: 1,
        link: 1,
        membersCount: { $size: '$members' },
      },
    },
    {
      $sort: {
        membersCount: -1,
      },
    },
    {
      $limit: 100,
    },
  ]);
}
