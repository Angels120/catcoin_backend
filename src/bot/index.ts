import { Bot, session, InlineKeyboard } from 'grammy';
import { env } from 'node:process';
import { MyContext, Session } from './types';
import { I18n } from '@grammyjs/i18n';
import { generateUpdateMiddleware } from 'telegraf-middleware-console-time';
import dotenv from 'dotenv';
import attachUser from './middlewares/attachUser';
import { ignoreOld, sequentialize } from 'grammy-middlewares';
import { bot, bot as menu } from './menu';
import configureI18n from './middlewares/configure-i18n';
import { revalidateCache } from '../service/main';
import axios from 'axios';

dotenv.config();
const token = env['BOT_TOKEN'];
if (!token) {
  throw new Error(
    'You have to provide the bot-token from @BotFather via environment variable (BOT_TOKEN)'
  );
}

const baseBot = new Bot<MyContext>(token);
if (env['NODE_ENV'] !== 'production') {
  baseBot.use(generateUpdateMiddleware());
}
export const i18n = new I18n({
  defaultLocale: 'en',
  useSession: true,
  directory: 'locales',
});
const initialSession: Session = {};
baseBot.use(i18n);

baseBot.use(ignoreOld());
baseBot.use(sequentialize());
baseBot.use(
  session<Session, MyContext>({
    initial: (): Session => initialSession,
  })
);
baseBot.use(attachUser);
baseBot.use(configureI18n);
export const sendMessage = async (chatId: number, text: string, keyboard?: any) => {
  try {
    await baseBot.api.sendMessage(chatId, text, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard,
    });
  } catch (e) {}
};

export const getUserAvatar = async (userId: number) => {
  try {
    const user = await baseBot.api.getUserProfilePhotos(userId);
    if (user.total_count === 0) {
      return undefined;
    }
    const chat = await baseBot.api.getChatMember(-1002184357008, userId);
    console.log("check join chat : ", chat.status);
    const fileId = user.photos[0][0].file_id;
    const file = await baseBot.api.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    //get base64 image
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data).toString('base64');
    return base64;
  } catch (e) {
    console.log(e);
  }
};

export const getUserInfo = async (userId: number) => {
  try {
    const chat = await baseBot.api.getChatMember(userId, userId);
    return chat.user;
  } catch (e) {
    return undefined;
  }
};

export const checkUserHasJoinedChat = async (userId: number, chat_id: number) => {
  try {
    const chat = await baseBot.api.getChatMember(chat_id, userId);
    return !['restricted', 'kicked', 'left'].includes(chat.status);
  } catch (e) {
    return undefined;
  }
};

// async function startMessage(ctx: MyContext) {
// 	const name = ctx.from?.first_name ?? "User";
// 	let text = `Hey ${name}!`;
// 	text += "\n\n";
// 	text += ctx.t("help");
// 	// Button text and URL

// 	await ctx.reply(text, {
// 		reply_markup: {
// 			inline_keyboard: [
// 				[
// 					{
// 						text: "hidanz.dev",
// 						url: "https://hidanz.dev/",
// 					},
// 				],
// 				[{ text: "🦑 Github", url: "https://github.com/HidanZZ" }],
// 			],
// 		},
// 	});
// }

// baseBot.command(["start", "help"], startMessage);

// baseBot.command("play", async (ctx) => {
// 	revalidateCache();
// 	const keyboard = new InlineKeyboard()
// 		.webApp("Play Game", "https://hidanz.dev/")
// 		.row()
// 		.url("🦑 Github", "https://github.com/HidanZZ");
// 	await ctx.reply("Play Game", {
// 		reply_markup: keyboard,
// 	});
// });

baseBot.use(menu);
export async function start(): Promise<void> {
  try {
    // The commands you set here will be shown as /commands like /start or /magic in your telegram client.
    await baseBot.api.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      // { command: 'top10', description: 'Show top 10 users' },
      // { command: 'teamstop10', description: 'Show top 10 teams' },
      // { command: 'profile', description: 'Show your profile' },
      // { command: 'friends', description: 'Show your affiliate link' },
      // { command: 'address', description: 'Enter your TON address' },
      // { command: 'help', description: 'Show help' },
    ]);

    await baseBot.start({
      drop_pending_updates: true,
      onStart(botInfo) {
        console.log(new Date(), 'Bot starts as', botInfo.username);
      },
    });
  } catch (e) {}
}
