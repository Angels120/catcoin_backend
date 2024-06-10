import { Composer, InlineKeyboard } from 'grammy';
import { MyContext } from '../../types';
import {
  getAffiliateLink,
  getTop10Teams,
  getUserScore,
  isAddressValid,
} from '../../../service/main';
import { StatelessQuestion } from '@grammyjs/stateless-question';
import { escapers } from '@telegraf/entity';
import { env } from 'node:process';
import {
  checkIfAddressExists,
  getTopUsersWithNonZeroScore,
  setUserAddress,
} from '../../../models/User';
import { getRank } from '../../../server/handlers/rank';
import { formatNumberString } from '../../../utils/constants';
import isAdmin from '../../middlewares/admin';
import { handleAffiliate } from '../../../server/handlers/affiliate';
import dotenv from 'dotenv';
import { getTeamById } from '../../../models/Team';
import { getBalance } from '../../../service/web3';
dotenv.config();

export const bot = new Composer<MyContext>();
const enterAddressQuestion = new StatelessQuestion<MyContext>('enterAddress', async (context) => {
  const answer = context.message.text;

  if (!answer || !isAddressValid(answer)) {
    await context.reply('This address is not valid ❌');
    await enterAddressQuestion.replyWithMarkdownV2(context, '➡️ Enter your TON address');
    return;
  }
  const addressExists = await checkIfAddressExists(answer);
  if (addressExists) {
    await context.reply('This address is already in use ❌');
    await enterAddressQuestion.replyWithMarkdownV2(context, '➡️ Enter your TON address');
    return;
  }
  const user = context.session.dbuser;
  if (user) {
    await setUserAddress(user?.id, answer);
    await startMessage(context);
  }
});

async function startMessage(ctx: MyContext) {
  const referralCode = ctx.session.ref_code;
  const user = ctx.session.dbuser;
  const keyboard = new InlineKeyboard()
    .webApp('🕹 Play Game', `${env['GAME_URL']}/play${referralCode ? `?ref=${referralCode}` : ''}`)
    .url('Referral Link', 'https://t.me/RecaTapperBot?start=getAffiliateLink');

  const username = ctx.from?.username;
  let text = `<b><u>Hello @${escapers.MarkdownV2(username ?? '')} ! </u></b>

🏆 Welcome to the ResistanceCat's Tap-Purr Bot, where you can earn rewards in $RECA + $TON just by tapping 💎

You can also earn Coins by inviting your friends to the game.

You can also earn coins together with your friends by creating a squad.

You can also earn coins by completing tasks and holding $RECA NFTs (coming soon) 

😼 Tap-Purr's community is still so early with all the youtube and TikTok Campaigns coming soon.

🐦 To stay updated, follow our Telegram @resistanceCatTon.

ENJOY TAPPING TAPP-PURRSS 🐈
`;

  await ctx.reply(text, {
    reply_markup: keyboard,
    parse_mode: 'HTML',
  });
}

async function prestartMessage(ctx: MyContext) {
  const username = ctx.from?.username;
  let text = `<b><u>Hello @${escapers.MarkdownV2(username ?? '')} !</u></b>

🏆 Welcome to the ResistanceCat's Tap-Purr Bot, where you can earn rewards in $RECA + $TON just by tapping 💎

You can also earn Coins by inviting your friends to the game.
  
You can also earn coins together with your friends by creating a squad.
  
You can also earn coins by completing tasks and holding $RECA NFTs (coming soon) 
  
😼 Tap-Purr's community is still so early with all the youtube and TikTok Campaigns coming soon.
  
🐦 To stay updated, follow our Telegram @resistanceCatTon.
  
<b>Also, we need your TON Wallet address to identify and track your scores, if you haven't got a TON Wallet Address Yet, You can create one here @wallet</b>

ENJOY TAPPING TAPP-PURRSS 🐈
`;
  await ctx.reply(text, {
    parse_mode: 'HTML',
  });
}

bot.command('start', async (ctx) => {
  try {
    const { text } = ctx.message || {};
    const { dbuser: user } = ctx.session;
    const referralCode = text?.split(' ')[1];

    if (referralCode?.startsWith('ref_')) {
      const code = referralCode.split('_')[1];
      if (user) handleAffiliate(user, code);
      ctx.session.ref_code = referralCode.split('_')[1];
    }
    // if (!user || !user.address) {
    //   await prestartMessage(ctx);
    //   await enterAddressQuestion.replyWithMarkdownV2(ctx, '➡️ Enter your TON address');
    //   return;
    // }

    switch (referralCode) {
      case 'getAffiliateLink':
        await getAffiliateLink(ctx);
        break;
      default:
        await startMessage(ctx);
    }
  } catch (e) {}
});
// bot.command('profile', async (ctx) => {
//   try {
//     const user = ctx.session.dbuser;

//     if (!user) {
//       return;
//     }
//     const total_score = await getUserScore(user.id);
//     let team;
//     if (user.team) {
//       team = await getTeamById(user.team);
//     }
//     const text = `@${escapers.MarkdownV2(user.username)} *profile*:

// 🏆 ${getRank(user.score, 'user')} League
// 🪙 Total score: ${total_score}
// 🪙 Balance: ${total_score}
// 👥 Team: ${team ? team.name : 'No team'}
// `;

//     await ctx.reply(text, {
//       parse_mode: 'MarkdownV2',
//     });
//   } catch (e) {}
// });
// bot.command('friends', async (ctx) => {
//   try {
//     await getAffiliateLink(ctx);
//   } catch (e) {}
// });
// bot.command('top10', async (ctx) => {
//   try {
//     const top10 = await getTopUsersWithNonZeroScore(10);
//     const text = `*Top 10*:

// ${
//   top10.length === 0
//     ? 'No users yet'
//     : top10
//         .map((user, index) => {
//           return `${index + 1}\\. ${
//             user.username ? '@' + escapers.MarkdownV2(user.username ?? 'N/A') : 'N/A'
//           } ➖ \`${formatNumberString(user.score)}\``;
//         })
//         .join('\n')
// }`;

//     await ctx.reply(text, {
//       parse_mode: 'MarkdownV2',
//     });
//   } catch (e) {}
// });

bot.command('address', async (ctx) => {
  try {
    await enterAddressQuestion.replyWithMarkdownV2(ctx, '➡️ Enter your TON address');
  } catch (e) {}
});

// bot.command('teamstop10', async (ctx) => {
//   try {
//     const top10 = await getTop10Teams();
//     const text = `*Top 10 Teams*:

// ${top10
//   .map((team, index) => {
//     return `${index + 1}\\. *${escapers.MarkdownV2(team.name)}* ➖ \`${formatNumberString(
//       team.score
//     )}\``;
//   })
//   .join('\n')}`;

//     await ctx.reply(text, {
//       parse_mode: 'MarkdownV2',
//     });
//   } catch (e) {}
// });

bot.use(enterAddressQuestion.middleware());
