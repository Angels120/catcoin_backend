import { NextFunction } from 'grammy';
import { MyContext } from '../types';

const ADMIN = [7314466396];

export default async function isAdmin(ctx: MyContext, next: NextFunction) {
  if (!ctx.from) {
    throw new Error('No from field found');
  }
  if (!ADMIN.includes(ctx.from.id)) {
    return;
  }
  return next();
}
