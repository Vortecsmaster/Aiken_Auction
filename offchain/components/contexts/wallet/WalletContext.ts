import { createContext, useContext } from "react";

import { Address, Blockfrost, LucidEvolution, Network } from "@lucid-evolution/lucid";
import { Wallet } from "@/types/cardano";

export type WalletConnection = {
  network?: Network;
  lucid?: LucidEvolution;
  blockfrost?: Blockfrost;
  wallet?: Wallet;
  address?: Address;
};

export const WalletContext = createContext<[WalletConnection, (wallet: WalletConnection) => void]>([{}, () => {}]);
export const useWallet = () => useContext(WalletContext);
