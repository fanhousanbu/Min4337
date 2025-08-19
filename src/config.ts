import { config } from 'dotenv';
import { Config } from './types';

config();

export const appConfig: Config = {
  rpcUrl: process.env.ETH_RPC_URL!,
  privateKey: process.env.ETH_PRIVATE_KEY!,
  bundlerUrl: process.env.BUNDLER_RPC_URL!,
  factoryAddress: process.env.ACCOUNT_FACTORY_ADDRESS!,
  entryPointAddress: process.env.ENTRY_POINT_ADDRESS!,
};