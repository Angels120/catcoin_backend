import { Schema, model, Types, ResolveTimestamps } from 'mongoose';
import { getUsersBoostsCache, setUserBoostsCache } from '../cache';
import { getDailyTasks } from './Task';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export interface IUser {
  _id: Types.ObjectId | string;
  id: number;
  language: string;
  score: number;
  balance: number;
  refferedBy?: Types.ObjectId;
  referrals: Types.ObjectId[];
  address?: string;
  username: string;
  team?: Types.ObjectId | string;
  boosts: { type: BoostType; level: number }[];
  completedTasks: (Types.ObjectId | string)[];
  nfts: { id: string; rareness: string; timestamp: number }[];
  created: Date;
}
export type BoostType =
  | 'tapAmount'
  // | "maxClicks"
  | 'regenTime';
const BOOST_GROWTH_FACTOR = {
  tapAmount: 1.5, // Cost multiplies by 1.8 with each level for tap amount boost
  // maxClicks: 3, // Cost doubles with each level for max clicks boost
  regenTime: 1.5, // Cost multiplies by 2.5 with each level for regeneration time boost
};

const BOOST_BASE_COST = {
  tapAmount: 0.1, // Initial cost to increase the tap amount
  // maxClicks: 150, // Initial cost to increase the maximum number of clicks
  regenTime: 0.2, // Initial cost to decrease the regeneration time
};

export const BOOST_NAMES = {
  tapAmount: 'Tap Amount',
  // maxClicks: "Max Clicks",
  regenTime: 'Clicks Regenerated',
};

export const BOOST_DESCRIPTIONS = {
  tapAmount: 'Increase the number of clicks per tap',
  // maxClicks: "Increase the maximum number of clicks",
  regenTime: 'Increase the rate at which clicks regenerate',
};

export const BOOST_SUBTITLE = {
  tapAmount: '+1 Point per tap',
  // maxClicks: "+500 per level",
  regenTime: '+1 click regen per level',
};
export const BOOST_EMOTES = {
  tapAmount: '🔨',
  // maxClicks: "🔍",
  regenTime: '🔄',
};
export function calculateNextLevelCost(boostType: BoostType, currentLevel: number) {
  const baseCost = BOOST_BASE_COST[boostType];
  const growthFactor = BOOST_GROWTH_FACTOR[boostType];
  const nextLevelCost = baseCost * Math.pow(growthFactor, currentLevel);
  return nextLevelCost.toFixed(2);
}

const userSchema = new Schema<IUser>({
  id: {
    type: Number,
    required: true,
  },
  language: {
    type: String,
    required: true,
    default: 'en',
  },
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  refferedBy: {
    type: Types.ObjectId,
    ref: 'User',
  },
  referrals: [
    {
      type: Types.ObjectId,
      ref: 'User',
    },
  ],
  address: {
    type: String,
  },
  username: {
    type: String,
  },
  team: {
    type: Types.ObjectId,
    ref: 'Team',
  },
  boosts: [
    {
      type: {
        type: String,
        enum: [
          'tapAmount',
          //   'maxClicks',
          'regenTime',
        ],
      },
      level: { type: Number, default: 0 },
    },
  ],
  completedTasks: [
    {
      type: Types.ObjectId,
      ref: 'Task',
    },
  ],
  nfts: [
    {
      id: {
        type: String,
      },
      rareness: {
        type: String,
      },
      timestamp: {
        type: Number,
      },
    },
  ],
  created: {
    type: Date,
    required: true
  }
});

const User = model<IUser>('User', userSchema);

export async function isUserExist(id: number) {
  try {
    return await User.exists({ id });
  } catch (err) {
    return null;
  }
}

export async function findOrCreateUser(id: number) {
  try {
    return await User.findOneAndUpdate(
      { id },
      {},
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}

export async function setUserTeam(id: number | string, teamId: Types.ObjectId | string | null) {
  try {
    return await User.findOneAndUpdate(
      { id },
      {
        team: teamId,
      },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}
export async function setUserBalance(id: number | string, balance: number) {
  try {
    return await User.findOneAndUpdate(
      { id },
      { balance },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}
export async function removeDailyTasksFromUsers() {
  try {
    const dailyTasks = await getDailyTasks();
    const dailyTaskIds = dailyTasks.map((task) => task._id);
    return await User.updateMany({}, { $pullAll: { completedTasks: dailyTaskIds } });
  } catch (err) {
    return null;
  }
}

export async function getUsersReferredBy(refferedBy: Types.ObjectId | string) {
  try {
    return await User.find({ refferedBy }).sort({ score: -1 }).limit(10);
  } catch (err) {
    return null;
  }
}

export async function getUserByTeamId(teamId: Types.ObjectId | string) {
  try {
    return await User.find({ team: teamId });
  } catch (err) {
    return null;
  }
}

export async function checkIfAddressExists(address: string) {
  try {
    return await User.exists({ address });
  } catch (err) {
    return null;
  }
}

export async function setUserAddress(id: number, address: string) {
  try {
    return await User.findOneAndUpdate(
      { id },
      { address },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}
export async function addCompletedTask(id: number, taskId: Types.ObjectId | string) {
  try {
    return await User.findOneAndUpdate(
      { id },
      { $push: { completedTasks: taskId } },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}
export async function createUserWithUsername(id: number, username?: string) {
  try {
    const defaultBoosts = [
      { type: 'tapAmount', level: 0 },
      // { type: 'maxClicks', level: 0 },
      { type: 'regenTime', level: 0 },
    ];
    await setUserBoostsCache(id.toString(), defaultBoosts);
    return await User.findOneAndUpdate(
      { id },
      {
        username,
        boosts: defaultBoosts,
      },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}

export async function getReferralCount(_id: string | Types.ObjectId) {
  try {
    const count = await User.find({ refferedBy: _id }).countDocuments();
    return count;
  } catch (err) {
    return null;
  }
}

export async function getUsersBoosts(id: string) {
  try {
    const boosts = await getUsersBoostsCache(id);

    if (boosts) {
      return boosts;
    }
    const user = await User.findOne({ id });

    if (user) {
      await setUserBoostsCache(id, user.boosts);
    }
    return user?.boosts;
  } catch (err) {
    return null;
  }
}
export async function addReferral(id: number, referralId: Types.ObjectId | string) {
  try {
    return await User.findOneAndUpdate(
      { id },
      { $push: { referrals: referralId } },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}

export async function setRefferedBy(id: number, referredId: Types.ObjectId | string) {
  try {
    return await User.findOneAndUpdate(
      { id },
      { refferedBy: referredId },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}
export async function changeLanguage(id: number, language: string) {
  try {
    return await User.findOneAndUpdate(
      { id },
      { language },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}

export async function incrementScore(id: number | string, incrementAmount: number) {
  try {
    return await User.findOneAndUpdate(
      { id },
      { $inc: { score: incrementAmount } },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}

export async function resetDbScore(id: number | string) {
  try {
    return await User.findOneAndUpdate(
      { id },
      { score : 0 },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}

export async function getUserByUserId(id: number | string) {
  try {
    const user = await User.findOne({ id });
    return user;
  } catch (err) {
    // console.log(err);
    return null;
  }
}

export async function getUserCompletedTasks(id: number | string) {
  try {
    const user = await User.findOne({ id });
    return user?.completedTasks;
  } catch (err) {
    return null;
  }
}

export async function getAllUsers() {
  try {
    const users = await User.find({})
                  .sort({score: -1});
    return users;
  } catch (err) {
    return [];
  }
}

export async function fetchUsers(start: number, limit: number){
  try {
    const users = await User.find().sort({ score: -1, _id: 1 }).skip(start).limit(limit).exec();
    return users;
  } catch (error) {
    return [];
  }
}

export async function getTopUsersWithNonZeroScore(limit: number) {
  try {
    return await User.find({ score: { $gt: 0 } })
      .sort({ score: -1 })
      .limit(limit);
  } catch (err) {
    return [];
  }
}

export async function getAllUsersDescScoreWithAddressExists() {
  try {
    return await User.find({ address: { $exists: true } }).sort({
      score: -1,
    });
  } catch (err) {
    return [];
  }
}

export async function getTopUsersWithNonZeroScoreWithTeam(
  limit: number,
  teamId: Types.ObjectId | string
) {
  try {
    return await User.find({ score: { $gt: 0 }, team: teamId })
      .sort({ score: -1 })
      .limit(limit);
  } catch (err) {
    return [];
  }
}

export async function getTotalUsersLength() {
  try {
    const users =  await User.find({});
    return users.length;
  } catch (error) {
    return 0;
  }
}

export async function getPlayersCountForLast8Weeks() {
  try {
    

    // Get the current date
    const now = new Date();

    // Define the past 8 weeks ranges
    const weeks = Array.from({ length: 8 }).map((_, index) => {
      const start = startOfWeek(subWeeks(now, index), { weekStartsOn: 1 }); // Week starts on Monday
      const end = endOfWeek(subWeeks(now, index), { weekStartsOn: 1 });
      return { start, end };
    });

    // Perform aggregation to get the number of unique players per week
    const results = await Promise.all(
      weeks.map(({ start, end }) =>
        User.aggregate([
          {
            $match: {
              created: {
                $lte: start
              },
            },
          },
          {
            $group: {
              _id: null, // No specific grouping key
              uniquePlayers: { $addToSet: '$id' },
            },
          },
          {
            $project: {
              _id: 0, // Exclude the `_id` field
              players: { $size: '$uniquePlayers' }, // Count the unique players
            },
          },
        ])
      )
    );

    // Format the data to return a result per week
    const formattedResults = weeks.map((_, index) => ({
      week: `${8 - index -1} week(s) ago`, // Format like "8 week(s) ago"
      users: results[index][0]?.players || 0, // Default to 0 if no data
    }));

    return formattedResults;
  } catch (error) {
    console.error('Error fetching player data:', error);
    throw error;
  }
}
