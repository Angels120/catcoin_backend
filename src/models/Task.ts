import { Schema, model } from 'mongoose';
enum TaskCondition {
  'joinGroup',
  'joinGroup2',
  'link',
  'invites',
  'hold',
  'joinTeam',
}
export type TaskConditionType = keyof typeof TaskCondition;
interface ITask {
  _id: string;
  description: string;
  conditionType: TaskConditionType;
  conditionValue: number;
  reward: number;
  emoji: string;
  link?: string;
  isActive: boolean;
  daily?: boolean;
}

const taskSchema = new Schema<ITask>({
  description: { type: String, required: true },
  conditionType: {
    type: String,
    enum: Object.keys(TaskCondition) as TaskConditionType[],
    required: true,
  },
  link: { type: String },
  conditionValue: { type: Number, required: true },
  reward: { type: Number, default: 0 }, // Assuming reward is always points for simplicity
  emoji: { type: String, default: '🎉' },
  isActive: { type: Boolean, default: true },
  daily: { type: Boolean, default: false },
});

const Task = model<ITask>('Task', taskSchema);

const defaultTasks = [
  {
    description: 'Join RECA Lounge',
    conditionType: 'joinGroup2',
    conditionValue: 1,
    reward: 10000,
    emoji: '🐱‍👤',
    link: 'https://t.me/RecaLounge',
  },
  // {
  //   description: 'Subscribe to Solana Contracts',
  //   conditionType: 'joinGroup2',
  //   conditionValue: 1,
  //   reward: 10000,
  //   emoji: '🤖',
  //   link: 'https://t.me/solanacontracts',
  // },
  {
    description: 'Join telegram group',
    conditionType: 'joinGroup',
    conditionValue: 1,
    reward: 10000,
    emoji: '💎',
    link: 'https://t.me/ResistanceCatTon',
  },
  {
    description: 'Follow on twitter',
    conditionType: 'link',
    conditionValue: 1,
    reward: 10000,
    emoji: '🐥',
    link: 'https://twitter.com/ResistanceCat/',
  },
  {
    description: 'Like post daily',
    conditionType: 'link',
    conditionValue: 1,
    reward: 10000,
    emoji: '👍',
    daily: true,
    link: 'https://twitter.com/ResistanceCat/',
  },
  // {
  // 	description: "Read docs",
  // 	conditionType: "link",
  // 	conditionValue: 1,
  // 	reward: 10000,
  // 	emoji: "📚",
  // 	link: "https://cryptoempiretycoon.gitbook.io/meme-trade-whitepaper/",
  // },
  {
    description: 'Visit website daily',
    conditionType: 'link',
    conditionValue: 1,
    reward: 10000,
    emoji: '🌐',
    daily: true,
    link: 'https://reca.live',
  },
  {
    description: 'Invite 1 friends',
    conditionType: 'invites',
    conditionValue: 1,
    reward: 10000,
    emoji: '📨',
  },
  //   {
  //     description: 'Invite 5 friends',
  //     conditionType: 'invites',
  //     conditionValue: 5,
  //     reward: 50000,
  //     emoji: '📨',
  //   },
  {
    description: 'Invite 10 friends',
    conditionType: 'invites',
    conditionValue: 10,
    reward: 100000,
    emoji: '📨',
  },
  //   {
  //     description: 'Invite 25 friends',
  //     conditionType: 'invites',
  //     conditionValue: 25,
  //     reward: 250000,
  //     emoji: '📨',
  //   },
  {
    description: 'Invite 50 friends',
    conditionType: 'invites',
    conditionValue: 50,
    reward: 500000,
    emoji: '📨',
  },
  //   {
  //     description: 'Invite 100 friends',
  //     conditionType: 'invites',
  //     conditionValue: 100,
  //     reward: 1000000,
  //     emoji: '📨',
  //   },
  {
    description: 'Invite 500 friends',
    conditionType: 'invites',
    conditionValue: 500,
    reward: 5000000,
    emoji: '📨',
  },
  //   {
  //     description: 'Invite 1000 friends',
  //     conditionType: 'invites',
  //     conditionValue: 1000,
  //     reward: 10000000,
  //     emoji: '📨',
  //   },
  {
    description: 'Hold Common NFT',
    conditionType: 'hold',
    conditionValue: 1,
    reward: 5000,
    emoji: '💰',
  },
  {
    description: 'Hold Rare NFT',
    conditionType: 'hold',
    conditionValue: 2,
    reward: 10000,
    emoji: '💰',
  },
  {
    description: 'Hold Mythic NFT',
    conditionType: 'hold',
    conditionValue: 3,
    reward: 15000,
    emoji: '💰',
  },
  {
    description: 'Hold Legendary NFT',
    conditionType: 'hold',
    conditionValue: 4,
    reward: 20000,
    emoji: '💰',
  },
  {
    description: 'Hold Common NFT for 3 days',
    conditionType: 'hold',
    conditionValue: 5,
    reward: 15000,
    emoji: '💰',
  },
  {
    description: 'Hold Rare NFT for 3 days',
    conditionType: 'hold',
    conditionValue: 6,
    reward: 30000,
    emoji: '💰',
  },
  {
    description: 'Hold Mythic NFT for 3 days',
    conditionType: 'hold',
    conditionValue: 7,
    reward: 45000,
    emoji: '💰',
  },
  {
    description: 'Hold Legendary NFT for 3 days',
    conditionType: 'hold',
    conditionValue: 8,
    reward: 60000,
    emoji: '💰',
  },
  //   {
  //     description: 'Hold 1000 $EMPIRE',
  //     conditionType: 'hold',
  //     conditionValue: 1000,
  //     reward: 10000,
  //     emoji: '💰',
  //   },
  //   {
  //     description: 'Hold 5000 $EMPIRE',
  //     conditionType: 'hold',
  //     conditionValue: 5000,
  //     reward: 50000,
  //     emoji: '💰',
  //   },
  //   {
  //     description: 'Hold 10000 $EMPIRE',
  //     conditionType: 'hold',
  //     conditionValue: 10000,
  //     reward: 100000,
  //     emoji: '💰',
  //   },
  //   {
  //     description: 'Hold 100000 $EMPIRE',
  //     conditionType: 'hold',
  //     conditionValue: 100000,
  //     reward: 1000000,
  //     emoji: '💰',
  //   },
  //   {
  //     description: 'Join a team',
  //     conditionType: 'joinTeam',
  //     conditionValue: 1,
  //     reward: 10000,
  //     emoji: '👥',
  //   },
];

export function getDailyTasks() {
  return Task.find({ daily: true });
}

export async function initializeDefaultTasks() {
  try {
    for (const task of defaultTasks) {
      const taskExists = await Task.findOne({ description: task.description });
      if (!taskExists) {
        const newTask = new Task(task);
        await newTask.save();
      }
    }
  } catch (error) {
    console.error('Error initializing default tasks:', error);
  }
}

export async function getActiveTasks() {
  return await Task.find({ isActive: true });
}

export async function getTaskById(id: string) {
  return await Task.findById(id);
}
