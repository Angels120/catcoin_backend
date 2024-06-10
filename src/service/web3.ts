import axios from 'axios';
import Web3 from 'web3';
import { daysAgo } from '../utils/constants';
const web3 = new Web3('https://binance.llamarpc.com/');
const ADDRESS = '0x9b2d63b3072a385ca3209A539bD5898e105aC1DF';
const ABI = [
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    type: 'function',
  },
];

export const getBalance = async (account: string) => {
  try {
    const contract = new web3.eth.Contract(ABI, ADDRESS);
    const balance = await contract.methods.balanceOf(account).call();

    //@ts-ignore
    const balanceInEth = web3.utils.fromWei(balance, 'ether');

    return Number(balanceInEth);
  } catch (e) {
    return 0;
  }
};
export const checkNft = async (address: string, winValue: number) => {
  try {
    const userNFTs = await axios.get(
      `https://toncenter.com/api/v3/nft/items?owner_address=${address}&collection_address=EQB5hJTRv6YkttgnzknE-WX7DiVKeAbhWjHmCv0ErcPSD80Q&limit=128&offset=0&api_key=b71967584313047eb88f7ca297e19839da3e17b2832051fd86e5213dab131f5b`
    );

    const nfts = [];

    for (const nft of userNFTs.data.nft_items) {
      const nftHistory = await axios.get(
        `https://toncenter.com/api/v3/nft/transfers?address=${address}&item_address=${nft.address}&direction=both&limit=1&offset=0&sort=desc&api_key=b71967584313047eb88f7ca297e19839da3e17b2832051fd86e5213dab131f5b`
      );

      const nftAge = nftHistory.data.nft_transfers[0].transaction_now;

      const type = await axios.get(
        `https://api.allorigins.win/get?url=${encodeURIComponent(nft.content.uri)}`
      );

      nfts.push({
        address: nft.address,
        collection: nft.collection,
        age: daysAgo(nftAge),
        type: JSON.parse(type.data.contents).description,
      });
    }

    switch (winValue) {
      case 1:
        return nfts.find((nft) => nft.type.toLowerCase().includes('common')) ? true : false;
      case 2:
        return nfts.find((nft) => nft.type.toLowerCase().includes('rare')) ? true : false;
      case 3:
        return nfts.find((nft) => nft.type.toLowerCase().includes('mythic')) ? true : false;
      case 4:
        return nfts.find((nft) => nft.type.toLowerCase().includes('legendary')) ? true : false;
      case 5:
        return nfts.find((nft) => nft.type.toLowerCase().includes('common') && nft.age >= 3)
          ? true
          : false;
      case 6:
        return nfts.find((nft) => nft.type.toLowerCase().includes('rare') && nft.age >= 3)
          ? true
          : false;
      case 7:
        return nfts.find((nft) => nft.type.toLowerCase().includes('mythic') && nft.age >= 3)
          ? true
          : false;
      case 8:
        return nfts.find((nft) => nft.type.toLowerCase().includes('legendary') && nft.age >= 3)
          ? true
          : false;
      default:
        return false;
    }
  } catch (e) {
    return false;
  }
};

// https://tonapi.io/v2/accounts/EQCbE-GBWUMpaTAzP_bD-aDBOHxi1Ji1FupbMZpcmjuvjwXX
// https://tonapi.io/v2/accounts/EQCbE-GBWUMpaTAzP_bD-aDBOHxi1Ji1FupbMZpcmjuvjwXX/nfts?collection=0%3Af2f4c01bd0540dd16a438bc3558a8dab10370ad9c48334378424e116f4f23222&limit=1000&offset=0&indirect_ownership=false
// https://tonapi.io/v2/nfts/0%3A0c3fdc19ab86cdaaa796bee2c210506d1b59fb504bc91e3f2f3c8fb944ca6d98/history?limit=100

// const getUserNFTs = async (address: string) => {
//   try{
//   const userData = await axios.get(`https://tonapi.io/v2/accounts/${address}`);

//   const userTonAddress = userData.data.address;

//   const userNFTs = await axios.get(
//     `https://tonapi.io/v2/accounts/${userTonAddress}/nfts?limit=1000&offset=0&indirect_ownership=false`
//   );

//   const nfts = [];

//   // user nft age
//   for (const nft of userNFTs.data.nft_items) {
//     const nftHistory = await axios.get(`https://tonapi.io/v2/nfts/${nft.address}/history?limit=1`);
//     await time_sleep(1);

//     const nftAge = nftHistory.data.events[0].timestamp;
//     console.log(nftAge);

//     nfts.push({
//       id: nft.id,
//       collection: nft.collection,
//       age: nftAge,
//     });
//   }

//   return nfts;
//   } catch (e) {
//     return [];
//   }
// };

// const time_sleep = (seconds: number) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
