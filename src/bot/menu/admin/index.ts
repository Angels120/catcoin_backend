import { MenuTemplate } from 'grammy-inline-menu';
import { MyContext } from '../../types';
import { Composer } from 'grammy';
import {
  getAllUsers,
  getAllUsersDescScoreWithAddressExists,
  getTopUsersWithNonZeroScore,
  getTopUsersWithNonZeroScoreWithTeam,
} from '../../../models/User';
import { getFile } from '../../utils';
import { getTop10Teams, top10TeamsExpensive } from '../../../service/main';
import { StatelessQuestion } from '@grammyjs/stateless-question';
import PQueue from 'p-queue';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>('Admin Settings');
menu.interact('Export All Users', 'exportau', {
  do: async (ctx) => {
    try {
      const all = await getAllUsers();
      let csvContent = 'Rank, Username, UserId, Address, Points, Referrals\n';
      all.sort((a, b) => b.score - a.score);
      all.forEach((user, index) => {
        csvContent += `${index + 1}, ${user.username}, ${user.id}, ${user.address}, ${
          user.score
        } , ${user.referrals.length}\n`;
      });
      const file = await getFile(csvContent, 'allUsers');
      await ctx.replyWithDocument(file);
      return false;
    } catch (err) {
      await ctx.reply('Error occured while exporting all users');
      console.log(err);

      return false;
    }
  },
});

menu.interact('Export Top 10 teams', 'exportT10t', {
  do: async (ctx) => {
    try {
      const top10 = await top10TeamsExpensive();

      let csvContent = 'Rank, Team Name, Username, UserId, Address, Points\n';
      for (const [index, team] of top10.entries()) {
        const topusers = await getTopUsersWithNonZeroScoreWithTeam(10, team.id);
        topusers.forEach((user) => {
          csvContent += `${index + 1}, ${team.name}, ${user.username}, ${user.id}, ${
            user.address
          }, ${user.score}\n`;
        });
      }
      const file = await getFile(csvContent, 'top10teams');
      await ctx.replyWithDocument(file);

      return false;
    } catch (err) {
      await ctx.reply('Error occured while exporting top 10 teams');
      return false;
    }
  },
});

menu.interact('Stats', 'stats', {
  do: async (ctx) => {
    try {
      const top10 = await getTopUsersWithNonZeroScore(10);

      const top10Teams = await getTop10Teams();
      const totalUsers = await getAllUsers();
      const highestScore = top10[0].score;
      const referralCount = totalUsers.reduce((acc, user) => {
        return acc + user.referrals.length;
      }, 0);

      const text = `*📊 Stats*:

*🥇 Highest Score:* ${highestScore} 
*👥 Total Users:* ${totalUsers.length} 
*🏆 Top 10 Team:* ${top10Teams[0].name || 'None'} 
*🔗 Total Referrals:* ${referralCount}
`;

      await ctx.reply(text, {
        parse_mode: 'MarkdownV2',
      });

      return false;
    } catch (err) {
      await ctx.reply('Error occured while getting stats');
      return false;
    }
  },
});

menu.interact('Send Message', 'sendmessage', {
  do: async (ctx) => {
    try {
      await enterAddressQuestion.replyWithHTML(
        ctx,
        `
<b>This is going to send a message to all users ⚠<i> Make sure you test with a preview first </i>⚠</b>

➡️ Enter your message in JSON format : 

<pre>{ 
"image": "https://i.imgur.com/TAunimR.jpeg",
"video": "https://i.imgur.com/TAunimR.mp4",
"caption": "caption is this",
"buttons": [{"text": "button text", "url": "https://i.imgur.com/TAunimR.jpeg"}],
"links": [{"text": "link text", "url": "https://i.imgur.com/TAunimR.jpeg"}] 
}</pre>

--------------------------------------
<b>
1. If you don't have an image, you can remove the image key from the JSON 
2. If you don't have any buttons, you can remove the buttons key from the JSON
3. If you don't have any links, you can remove the links key from the JSON
4. If you don't have a caption, you can remove the caption key from the JSON
5. If you have a video, you can add the video key in the JSON and the video will be sent instead of the image
</b>`
      );
      return 'sendmessage';
    } catch (err) {
      await ctx.reply('Error occured while sending message');

      return false;
    }
  },
});

menu.interact('Send Message Preview', 'sendmessagepreview', {
  do: async (ctx) => {
    try {
      await enterAddressQuestionPreview.replyWithHTML(
        ctx,
        `
<b>This is a preview of how the message will look like</b>

➡️ Enter your message in JSON format : 

<pre>{ 
"image": "https://i.imgur.com/TAunimR.jpeg",
"video": "https://i.imgur.com/TAunimR.mp4",
"caption": "caption is this",
"buttons": [{"text": "button text", "url": "https://i.imgur.com/TAunimR.jpeg"}],
"links": [{"text": "link text", "url": "https://i.imgur.com/TAunimR.jpeg"}] 
}</pre>

--------------------------------------
<b>
1. If you don't have an image, you can remove the image key from the JSON 
2. If you don't have any buttons, you can remove the buttons key from the JSON
3. If you don't have any links, you can remove the links key from the JSON
4. If you don't have a caption, you can remove the caption key from the JSON
5. If you have a video, you can add the video key in the JSON and the video will be sent instead of the image
</b>`
      );
      return 'sendmessagepreview';
    } catch (err) {
      await ctx.reply('Error occured while sending message');

      return false;
    }
  },
});

const enterAddressQuestionPreview = new StatelessQuestion<MyContext>(
  'sendmessagepreview',
  async (ctx) => {
    try {
      const message = ctx.message.text;
      if (!message) {
        await ctx.reply('Message is empty');
        return;
      }
      const parsedMessage = JSON.parse(message);
      if (!parsedMessage) {
        await ctx.reply('Invalid message format');
        return;
      }
      const { image, caption, buttons, links, video } = parsedMessage;

      const textWithLinks =
        caption +
        '\n\n' +
        (links || []).map((link: any) => `[${link.text}](${link.url})`).join('\n');

      const dataToSend = {
        image,
        caption: textWithLinks,
        buttons,
        video,
      };

      sendMessageToUser(ctx, dataToSend, ctx.from?.id);

      return;
    } catch (err) {
      await ctx.reply('Error occured while sending message');

      return;
    }
  }
);

const enterAddressQuestion = new StatelessQuestion<MyContext>('sendmessage', async (ctx) => {
  try {
    const message = ctx.message.text;
    if (!message) {
      await ctx.reply('Message is empty');
      return;
    }
    const parsedMessage = JSON.parse(message);
    if (!parsedMessage) {
      await ctx.reply('Invalid message format');
      return;
    }
    const { image, caption, buttons, links, video } = parsedMessage;

    const textWithLinks =
      caption + '\n\n' + (links || []).map((link: any) => `[${link.text}](${link.url})`).join('\n');

    const dataToSend = {
      image,
      caption: textWithLinks,
      buttons,
      video,
    };

    const allUsers = await getAllUsers();

    const users = allUsers.map((user) => user.id);

    const queue = new PQueue({ intervalCap: 5, interval: 1000 });
    await ctx.reply(
      `Sending message to all users in approximately ${users.length / 5 / 60} minutes`
    );

    for (const userId of users) {
      queue.add(() => sendMessageToUser(ctx, dataToSend, userId));
    }

    queue.onIdle().then(() => {
      ctx.reply('Message sent to all users');
      queue.clear();
    });

    return;
  } catch (err) {
    await ctx.reply('Error occured while sending message');

    return;
  }
});

const sendMessageToUser = async (ctx: MyContext, dataToSend: any, idUser: any) => {
  try {
    const { image, caption, buttons, video } = dataToSend;

    if (!idUser) return;
    if (video) {
      await ctx.api.sendVideo(idUser, video, {
        caption: caption,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: (buttons || []).map((button: any) => [
            {
              text: button.text,
              url: button.url,
            },
          ]),
        },
      });
    } else if (image) {
      await ctx.api.sendPhoto(idUser, image, {
        caption: caption,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: (buttons || []).map((button: any) => [
            {
              text: button.text,
              url: button.url,
            },
          ]),
        },
      });
    } else {
      await ctx.api.sendMessage(idUser, caption, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: (buttons || []).map((button: any) => [
            {
              text: button.text,
              url: button.url,
            },
          ]),
        },
      });
    }
  } catch (err) {}
};

bot.use(enterAddressQuestionPreview.middleware());
bot.use(enterAddressQuestion.middleware());
