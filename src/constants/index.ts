import { Cluster } from "@solana/web3.js";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

require('dotenv').config()

// Endpoints, connection
export const ENV: Cluster = (process.env.cluster as Cluster) || "mainnet-beta";
export const SOLANA_RPC_ENDPOINT = ENV === "devnet"
    ? 'https://api.devnet.solana.com'
    : "https://solana-api.projectserum.com";

export const GENESYS_GO_RPC_ENDPOINT = 'https://ssc-dao.genesysgo.net';

// Wallets
export const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "PASTE YOUR WALLET PRIVATE KEY";
export const USER_PRIVATE_KEY = bs58.decode(WALLET_PRIVATE_KEY);
export const USER_KEYPAIR = Keypair.fromSecretKey(USER_PRIVATE_KEY);

// Maximum value we should be looking for at each coin
export const INPUT_AMOUNTS: any = {
    // "USDC" : 50,
    // "SOL" : 1,
    // "UST" : 100,
    // "USDT" : 100,
    // "mSOL" : 1,
    // "RAY": 50,
    // "CASH": 10,
    // "USDH": 100,
    // "sUSDC-9": 100,
    // "stSOL": 1,
    // "POLIS": 10,
    // "SBR": 1000,
    // "SNY": 100,
    // "CAVE": 100,
    // "SAMO": 1000,
    // "WOOF": 10000,
    // "NAXAR": 100,
    // "STEP": 1000,
    // "KURO": 1000
};

// Interface
export interface Token {
    chainId: number;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI: string;
    tags: string[];
} 
