import { Connection, PublicKey } from "@solana/web3.js";
import fetch from "isomorphic-fetch";

import { Jupiter, RouteInfo, TOKEN_LIST_URL } from "@jup-ag/core";
import {
  ENV,
  SOLANA_RPC_ENDPOINT,
  QUICKNODE_RPC_ENDPOINT,
  Token,
  USER_KEYPAIR,
} from "./constants";

function readableAmount(amount: number, decimals: number) {
  const quote = amount / 10 ** decimals;
  return quote;
}

function extractToken(tokenList: Token[], tokenSymbol: string): Token {
  const foundToken = tokenList.find(function (item: any, i: number) {
    if (item.symbol === tokenSymbol) {
      return tokenList[i];
    }
  });
  if (foundToken) {
    return foundToken;
  }
  else {
    throw Error('Could not find token ' + tokenSymbol);
  }
}

function getTokenSymbolFromMint(tokenList: any, mintAddress: string): string {
  const foundToken = tokenList.find(function (item: any, i: number) {
    if (item.address === mintAddress) {
      return tokenList[i];
    }
  });
  if (foundToken) {
    return foundToken.symbol;
  }
  else {
    throw Error('Could not find token with mint address ' + mintAddress);
  }
}

function calculateProfitableTrade(inputAmount: number, receivedAmount: number, profitTarget: number): boolean {
  return (receivedAmount - inputAmount >= profitTarget) ? true : false;
}

const getRoutes = async ({
  jupiter,
  inputToken,
  outputToken,
  inputAmount,
  slippage,
}: {
  jupiter: Jupiter;
  inputToken?: Token;
  outputToken?: Token;
  inputAmount: number;
  slippage: number;
}) => {
  try {
    if (!inputToken || !outputToken) {
      return null;
    }

    const inputAmountLamports = inputToken ? Math.round(inputAmount * 10 ** inputToken.decimals) : 0;

    var routes;

    try {
      routes =
        inputToken && outputToken
          ? (await jupiter.computeRoutes({
            inputMint: new PublicKey(inputToken.address),
            outputMint: new PublicKey(outputToken.address),
            inputAmount: inputAmountLamports,
            slippage: slippage,
            forceFetch: true
          }
          ))
          : null;
    }
    catch (e) {
    }
    if (routes && routes.routesInfos) {
      return routes;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

const executeSwap = async ({
  jupiter,
  route,
}: {
  jupiter: Jupiter;
  route: RouteInfo;
}) => {
  try {
    const { execute } = await jupiter.exchange({
      routeInfo: route,
    });
    const swapResult: any = await execute();

    if (swapResult.error) {
      console.log(swapResult.error);
    } else {
      console.log(`https://explorer.solana.com/tx/${swapResult.txid}`);
      console.log(
        `inputAddress=${swapResult.inputAddress.toString()} outputAddress=${swapResult.outputAddress.toString()}`
      );
      console.log(
        `inputAmount=${swapResult.inputAmount} outputAmount=${swapResult.outputAmount}`
      );
    }
  } catch (error) {
    throw error;
  }
};

const main = async () => {

  console.log("📡   Establishing connection to RPC Endpoint\n\n");
  const connection = new Connection(QUICKNODE_RPC_ENDPOINT);

  console.log("🪙   Fetching token list from Jupiter\n\n");
  const tokens: Token[] = await (await fetch(TOKEN_LIST_URL[ENV])).json();

  console.log("🪐   Connecting to Jupiter\n\n");

  const jupiter = await Jupiter.load({
    connection,
    cluster: ENV,
    user: USER_KEYPAIR,
  });

  if (process.argv.length !== 4) {
    console.log('Script usage: npm start TOKEN AMOUNT');
    return 1;
  }

  const tokenSymbol = process.argv[2];
  const amount = Number.parseInt(process.argv[3]);

  const selectedToken = extractToken(tokens, tokenSymbol);

  console.log("💰   Selected token: " + tokenSymbol + "\n\n");
  console.log("💵   Amount: " + amount + "\n\n");

  while (1) {
    try {

      const beforeRoutes = new Date();

      const inputToken = selectedToken;
      const outputToken = inputToken;
      const routes = await getRoutes({
        jupiter,
        inputToken,
        outputToken,
        inputAmount: amount,
        slippage: 0,
      });

      if (routes) {
        const bestRoute = routes.routesInfos[0];
        const tokenQuote = readableAmount(bestRoute.outAmount, inputToken.decimals);
        if (calculateProfitableTrade(amount, tokenQuote, 0.1)) {
          console.log("💵   Executing swap.");
          await executeSwap({ jupiter, route: bestRoute });
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      console.log('After calculating routes: ' + (+new Date() - +beforeRoutes) / 1000.0 + ' seconds');

    } catch (error) {
      // console.log({ error });
    }
    // await new Promise(r => setTimeout(r, 1000));
  }
}

main();