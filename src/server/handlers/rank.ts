import { TeamRanks, UserRanks } from "../../utils/constants";

const rankList = [
	{
		rank: "bronze",
		score: { user: UserRanks.silver, team: TeamRanks.silver },
		image: "https://cdn.joincommunity.xyz/clicker/league/Bronze-95.png",
	},
	{
		rank: "silver",
		score: { user: UserRanks.gold, team: TeamRanks.gold },
		image: "https://cdn.joincommunity.xyz/clicker/league/Silver-95.png",
	},
	{
		rank: "gold",
		score: { user: UserRanks.platinum, team: TeamRanks.platinum },
		image: "https://cdn.joincommunity.xyz/clicker/league/Gold-95.png",
	},
	{
		rank: "platinum",
		score: { user: Infinity, team: Infinity },
		image: "https://cdn.joincommunity.xyz/clicker/league/Platinum-95.png",
	},
];

export const getRank = (score: number, type: "user" | "team") => {
	const rank = rankList.find((rankObj) => score < rankObj.score[type]);
	return rank
		? { rank: rank.rank, image: rank.image }
		: { rank: "bronze", image: rankList[0].image };
};
