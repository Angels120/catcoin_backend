import { tryCatch } from 'bullmq';
import { Schema, model, Types, ResolveTimestamps } from 'mongoose';
import bcrypt from "bcryptjs";

export interface IAdmin {
  _id: Types.ObjectId | string;
  email: string;
  username: string;
  password: string;
  role: string;
  created: Date;
}


const adminSchema = new Schema<IAdmin>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    default: "admin",
  },
  created: {
    type: Date,
    required: true
  }
});

const Admin = model<IAdmin>('Admin', adminSchema);

export async function initAdmin() {
  let superAdimin  = {
    email: 'Shelestovskiyvit@gmail.com',
    username: 'VitalitiSh',
    password: "Clicker2024@",
    role: 'superAdmin',
    created: new Date(),
  };
  const salt = await bcrypt.genSalt(10); // Generate salt
  const hashedPassword = await bcrypt.hash(superAdimin.password, salt);
  superAdimin.password = hashedPassword;
  const initAdmin = await Admin.exists({email: superAdimin.email});
  if(!initAdmin) {
    const newAdmin = new Admin(superAdimin);
    newAdmin.save();
  }
}

export async function findAdmin(email: string) {
    try {
        const admin = await Admin.findOne({email});
        return admin; 
    } catch (error) {
        console.log(error);
        return null;
    }
}