import { Schema, model } from 'mongoose';
import { startOfMonth, endOfMonth } from 'date-fns';


interface IStatistics {
  _id: string;
  userId: Number;
  lastInteraction: Date,
}

const statisticSchema = new Schema<IStatistics>({
  userId: {type: Number, required: true},
  lastInteraction: {type: Date, default: Date.now()}
});

const Statistics = model<IStatistics>('Statistics', statisticSchema);


export async function logUserInteraction(userId: number | undefined | string) {
  if (userId) {
    const interaction = new Statistics({ userId });
    await interaction.save();
  }
}


// Get unique users for the current month
export async function getMonthlyUsers(): Promise<number> {
  const startDate = startOfMonth(new Date());
  const endDate = endOfMonth(new Date());

  const users = await Statistics.aggregate([
    {
      $match: {
        interactionTime: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: '$userId',
      },
    },
  ]);

  return users.length;
}



