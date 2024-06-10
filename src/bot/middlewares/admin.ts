import { NextFunction } from 'grammy';
import { MyContext } from '../types';

const ADMIN = [2129914183, 5099082627];

export default async function isAdmin(ctx: MyContext, next: NextFunction) {
  if (!ctx.from) {
    throw new Error('No from field found');
  }
  if (!ADMIN.includes(ctx.from.id)) {
    return;
  }
  return next();
}
