import { Connection, PublicKey } from "@solana/web3.js";
import fetch from "isomorphic-fetch";

import { Jupiter, RouteInfo, TOKEN_LIST_URL } from "@jup-ag/core";
import {
  ENV,
  INPUT_AMOUNTS,
  SOLANA_RPC_ENDPOINT,
  Token,
  USER_KEYPAIR,
} from "./constants";

function readableAmount(amount: number, decimals: number) {
  const quote = amount / 10 ** decimals;
  return quote;
}

function extractToken(tokenList: any, tokenSymbol: string) {
  var foundToken;
  tokenList.find(function (item: any, i: number) {
    if (item.symbol === tokenSymbol) {
      foundToken = tokenList[i];
    }
  });
  return foundToken;
}

function getTokenSymbolFromMint(tokenList: any, mintAddress: string) {
  var foundToken;
  tokenList.find(function (item: any, i: number) {
    if (item.address === mintAddress) {
      foundToken = tokenList[i];
    }
  });
  return foundToken.symbol;
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

    const inputAmountLamports = inputToken
      ? Math.round(inputAmount * 10 ** inputToken.decimals)
      : 0; // Lamports based on token decimals
    const routes =
      inputToken && outputToken
        ? (await jupiter.computeRoutes(
          new PublicKey(inputToken.address),
          new PublicKey(outputToken.address),
          inputAmountLamports,
          slippage,
          true
        ))
        : null;

    if (routes && routes.routesInfos) {
      var marketChain = "";
      routes.routesInfos[0].marketInfos.forEach(
        marketInfo => marketChain += marketInfo.marketMeta.amm.label + 'x'
      );
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
    // Prepare execute exchange
    const { execute } = await jupiter.exchange({
      route,
    });
    // Execute swap
    const swapResult: any = await execute(); // Force any to ignore TS misidentifying SwapResult type

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

  console.log("📡   Establishing connection to Solana RPC Endpoint\n\n");
  const connection = new Connection(SOLANA_RPC_ENDPOINT);

  console.log("🪙   Fetching token list from Jupiter\n\n");
  const tokens: Token[] = await (await fetch(TOKEN_LIST_URL[ENV])).json();

  console.log("🪐   Connecting to Jupiter\n\n");

  const jupiter = await Jupiter.load({
    connection,
    cluster: ENV,
    user: USER_KEYPAIR,
  });

  const tokenDatabase: any = {};

  const keys: string[] = Object.keys(INPUT_AMOUNTS);

  for (const key of keys) {
    const token: any = extractToken(tokens, key);
    if (token !== undefined) {
      console.log(token);
      tokenDatabase[key] = {
        "data": token,
        "amount": INPUT_AMOUNTS[key]
      };
    }
    else {
      console.log("🙁   Token with symbol " + key + " could not be found in the database");
    }
  }

  console.log("💸   Extracted the following tokens from the database:\n\n")
  console.log(Object.keys(tokenDatabase));

  while (1) {
    try {
      for (var i = 0; i < keys.length; i++) {
        const inputToken = tokenDatabase[keys[i]].data;
        const outputToken = inputToken;
        const routes = await getRoutes({
          jupiter,
          inputToken,
          outputToken,
          inputAmount: tokenDatabase[keys[i]].amount, // 1 unit in UI
          slippage: 0.5, // 0.5% slippage
        });


        if (routes) {
          const bestRoute = routes.routesInfos[0];
          var swapChain = "";

          const tokenQuote = readableAmount(bestRoute.outAmount, inputToken.decimals);
          const ourInput = readableAmount(bestRoute.inAmount, inputToken.decimals);

          if (inputToken && tokenQuote && ourInput && (ourInput < tokenQuote)) {
            console.log("🚀   Found possible good swap for token: ", inputToken.symbol);

            const profit = tokenQuote - ourInput;

            for (var j = 0; j < bestRoute.marketInfos.length; j++) {
              swapChain += getTokenSymbolFromMint(tokens, bestRoute.marketInfos[j].inputMint.toString()) + " -> " +
                getTokenSymbolFromMint(tokens, bestRoute.marketInfos[j].outputMint.toString()) + " | ";
            }
            console.log("🏁   Swap route: " + swapChain);
            console.log("🤑   Total profit: ", profit);
            console.log(bestRoute);
            if (profit >= 0.5) {
              executeSwap({ jupiter, route: bestRoute });
              await new Promise(r => setTimeout(r, 1000));
            }
          }

        }
      }
    } catch (error) {
      console.log({ error });
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

main();