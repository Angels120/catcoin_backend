import { sendMessage } from '.';
import { getAllUsers } from '../models/User';
import fs from 'fs';
import path from 'path';
import { InputFile } from 'grammy';

export const sendMessageToAll = async (message: string) => {
  try {
    const users = await getAllUsers();
    users.forEach((user) => {
      sendMessage(user.id, message);
    });
  } catch (err) {}
};

// export const getFile = async (content: string, filename: string) => {
//   //@ts-ignore
//   const __dirname = import.meta.dirname;
//   const tempFilePath = path.join(__dirname, filename + '.csv');
//   fs.writeFileSync(tempFilePath, content);
//   const tempFile = new InputFile(tempFilePath);
//   return tempFile;
// };
