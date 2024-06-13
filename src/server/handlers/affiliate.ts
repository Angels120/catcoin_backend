import { getUserInfo } from '../../bot';
import { incrementScore } from '../../cache';
import { IUser, addReferral, getUserByUserId, setRefferedBy } from '../../models/User';

export async function handleAffiliate(userId: any, referralId: number | string) {
  //user cannot refer themselves
  if (userId.toString() === referralId.toString()) {
    return;
  }
  //find the user with the referral id
  const referredBy = await getUserByUserId(referralId);
  if (!referredBy) {
    return;
  }
  const userInfo = await getUserInfo(userId);
  const is_premium = userInfo?.is_premium;
  //set the referred by field
  await setRefferedBy(userId, referredBy._id);
  //increment the score of the user
  await incrementScore(referredBy.id, is_premium ? 50000 : 2500);
  await incrementScore(userId.toString(), is_premium ? 50000 : 2500);
  await addReferral(referredBy.id, userId);
}
