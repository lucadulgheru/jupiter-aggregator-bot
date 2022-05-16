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
export const QUICKNODE_RPC_ENDPOINT = 'https://aged-wispy-star.solana-mainnet.quiknode.pro/d53450ff6c55656f1bb10b12d175aa8400634ddf/';

// Wallet
export const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "PASTE YOUR WALLET PRIVATE KEY";
export const USER_PRIVATE_KEY = bs58.decode(WALLET_PRIVATE_KEY);
export const USER_KEYPAIR = Keypair.fromSecretKey(USER_PRIVATE_KEY);

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
