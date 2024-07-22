import { Schema, model } from 'mongoose';


interface IEra {
  _id: string;
  description: string;
  level: number;
  salo: number;
  rate: number;
  isActive: boolean;
  startDate: Date;
}

const eraSchema = new Schema<IEra>({
  description: { type: String, required: true },
  level: { type: Number, required: true },
  salo: { type: Number, required: true }, 
  rate: { type: Number, required: true },
  isActive: { type: Boolean, default: false },
  startDate : { type: Date, default: null}
});

const Era = model<IEra>('Era', eraSchema);

const defaultEras = [
  {
    description: 'The Era of Starry Sky',
    level: 1,
    salo: 1000,
    rate: 4,
    isActive : true
  },
  {
    description: 'The Age of Shing Sun',
    level: 2,
    salo: 900,
    rate: 8,
  },
  {
    description: 'The Age of Rushing Water',
    level: 3,
    salo: 800,
    rate: 16,
  },
  {
    description: 'The Era of High Mountains',
    level: 4,
    salo: 700,
    rate: 32,
  },
  {
    description: 'The Era of Thick Grass',
    level: 5,
    salo: 600,
    rate: 64,
  },
  {
    description: 'The Era of Majestic Forests',
    level: 6,
    salo: 500,
    rate: 128,
  },
  {
    description: 'The Era of Rushing Rivers',
    level: 7,
    salo: 400,
    rate: 256,
  },
  {
    description: 'The Era of White Sands',
    level: 8,
    salo: 300,
    rate: 512,
  },
  {
    description: 'The Era of Icebergs',
    level: 9,
    salo: 200,
    rate: 1028,
  },
  {
    description: 'The Era of Fiery Volcanoes',
    level: 10,
    salo: 100,
    rate: 2048,
  },
];

export async function getCurrentEra() {
  return Era.findOne({ isActive: true });
}

export async function initializeDefaultEras() {
  try {
    for (const era of defaultEras) {
      const eraExist = await Era.findOne({ level: era.level });
      if (!eraExist) {
        const newEra = new Era(era);
        await newEra.save();
      }
    }
  } catch (error) {
    console.error('Error initializing default era:', error);
  }
}

export async function setStartDate(level: number, startDate: Date) {
  try {
    return await Era.findOneAndUpdate(
      { level },
      { startDate },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}

export async function updateLevel() {
  try {
    const currentEra = await Era.findOneAndUpdate(
      { isActive : true },
      { isActive : false },
      {
        new: true,
      }
    );
    if (!currentEra) {
      console.error("No active era found");
      return null;
    }
    console.log("current level", currentEra.level);
    return await Era.findOneAndUpdate(
      { level : currentEra.level + 1 },
      { isActive : true },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    return null;
  }
}