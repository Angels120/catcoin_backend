import { atLeastOneTeamExist, createTeam } from '../models/Team';
import axios from 'axios';

type TeamApi = {
  flags: {
    png: string;
    svg: string;
    alt: string;
  };
  name: {
    common: string;
    official: string;
    nativeName: {
      cat: {
        official: string;
        common: string;
      };
    };
  };
  cca2: string;
};

// const starterTeams = [
// 	{
// 		name: "USA",
// 		logo: "https://flagcdn.com/w320/us.png",
// 		link: "https://t.me/notbabycoinusa",
// 		cca2: "US",
// 	},
// 	{
// 		name: "UK",
// 		logo: "https://flagcdn.com/w320/gb.png",
// 		link: "https://t.me/notbabycoinuk",
// 		cca2: "GB",
// 	},
// 	{
// 		name: "China",
// 		logo: "https://flagcdn.com/w320/cn.png",
// 		link: "https://t.me/notbabycoinchina",
// 		cca2: "CN",
// 	},
// 	{
// 		name: "India",
// 		logo: "https://flagcdn.com/w320/in.png",
// 		link: "https://t.me/notbabycoinindia",
// 		cca2: "IN",
// 	},
// 	{
// 		name: "Russia",
// 		logo: "https://flagcdn.com/w320/ru.png",
// 		link: "https://t.me/notbabycoinrussia",
// 		cca2: "RU",
// 	},
// 	{
// 		name: "Ukraine",
// 		logo: "https://flagcdn.com/w320/ua.png",
// 		link: "https://t.me/notbabycoinukraine",
// 		cca2: "UA",
// 	},
// 	{
// 		name: "Turkey",
// 		logo: "https://flagcdn.com/w320/tr.png",
// 		link: "https://t.me/notbabycointurkey",
// 		cca2: "TR",
// 	},
// 	{
// 		name: "Poland",
// 		logo: "https://flagcdn.com/w320/pl.png",
// 		link: "https://t.me/notbabycoinpoland",
// 		cca2: "PL",
// 	},
// ];
const starterTeams = [
  {
    name: 'Resistance Hub 🦾',
    logo: 'https://emojicdn.elk.sh/🦾',
    link: 'https://t.me/resistancehub',
    cca2: 'RH',
  },
  {
    name: 'The Clawed Crusaders 🐾',
    logo: 'https://emojicdn.elk.sh/🐾',
    link: 'https://t.me/theclawedcrusaders',
    cca2: 'CC',
  },
  {
    name: 'Bitcoin Bulls 🐂',
    logo: 'https://emojicdn.elk.sh/🐂',
    link: 'https://t.me/bitcoinbulls',
    cca2: 'BB',
  },
  {
    name: 'Ethereum Enthusiasts 🚀',
    logo: 'https://emojicdn.elk.sh/🚀',
    link: 'https://t.me/ethereumenthusiasts',
    cca2: 'EE',
  },
  {
    name: 'Ripple Racers 💧',
    logo: 'https://emojicdn.elk.sh/💧',
    link: 'https://t.me/rippleracers',
    cca2: 'RR',
  },
  {
    name: 'Litecoin Lovers 💚',
    logo: 'https://emojicdn.elk.sh/💚',
    link: 'https://t.me/litecoinlovers',
    cca2: 'LL',
  },
  {
    name: 'Dogecoin Devotees 🐕',
    logo: 'https://emojicdn.elk.sh/🐕',
    link: 'https://t.me/dogecoinddevotees',
    cca2: 'DD',
  },
  {
    name: 'Cardano Crusaders 🛡️',
    logo: 'https://emojicdn.elk.sh/🛡️',
    link: 'https://t.me/cardanocrusaders',
    cca2: 'CC',
  },
  {
    name: 'Chainlink Champions ⛓️',
    logo: 'https://emojicdn.elk.sh/⛓️',
    link: 'https://t.me/chainlinkchampions',
    cca2: 'CL',
  },
  {
    name: 'Solana Squad ☀️',
    logo: 'https://emojicdn.elk.sh/☀️',
    link: 'https://t.me/solanasquad',
    cca2: 'SS',
  },
];

export async function initTeams() {
  const exists = await atLeastOneTeamExist();
  if (!exists || exists.length < 10) {
    const teams = starterTeams.map((teamStarter: any) => {
      const team = createTeam({
        name: teamStarter.name,
        logo: teamStarter.logo,
        link: teamStarter.link,
        cca2: teamStarter.cca2,
      });
      return team;
    });
    Promise.all(teams)
      .then((teams) => {})
      .catch((err) => {});
  } else {
  }
}
