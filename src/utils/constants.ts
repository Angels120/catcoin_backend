import { escapers } from '@telegraf/entity';
import { Socket } from 'socket.io';

export const MAX_CLICKS_PER_DAY = 1000;
export const CLICK_REGEN_TIME = 1; // in seconds
export const userSockets: Map<string, Socket> = new Map();

export enum UserRanks {
  silver = 250000,
  gold = 500000,
  platinum = 2000000,
}

export enum TeamRanks {
  silver = 25000000,
  gold = 50000000,
  platinum = 200000000,
}

export function formatNumberString(num: number): string {
  const formattednum = num.toLocaleString('en-US');
  return escapers.MarkdownV2(formattednum);
}

export function daysAgo(timestamp: number) {
  // Convert the timestamp to milliseconds
  const millisecondsAgo = Date.now() - timestamp * 1000;

  // Convert milliseconds to days
  const daysAgo = Math.floor(millisecondsAgo / (1000 * 60 * 60 * 24));

  return daysAgo;
}
