import { Data, Json, PolicyId, Unit, UTxO, WalletApi } from "@lucid-evolution/lucid";

export type Wallet = {
  name: string;
  icon: string;
  apiVersion: string;
  enable(): Promise<WalletApi>;
  isEnabled(): Promise<boolean>;
};

export type AssetUTxO = {
  unit: Unit;
  policyID: PolicyId;
  assetName: string;
  qty: bigint;
  utxo: UTxO;
  bf: Json;
};

export type AuctionData = {
  assetUTxO?: AssetUTxO;
  datum?: DatumType;
  hasAuction?: boolean;
};

export const DatumSchema = Data.Object({
  assetValue: Data.Any(),
  sellerVKH: Data.Bytes(),
  sellerDKH: Data.Bytes(),
  minBid: Data.Integer(),
  endTime: Data.Integer(),
  currentBid: Data.Integer(),
  bidderVKH: Data.Bytes(),
  bidderDKH: Data.Bytes(),
});
export type DatumType = Data.Static<typeof DatumSchema>;
export const DatumType = DatumSchema as unknown as DatumType;

export const RedeemerSchema = Data.Object({
  action: Data.Integer(),
  bidAmount: Data.Integer(),
  bidderVKH: Data.Bytes(),
});
export type RedeemerType = Data.Static<typeof RedeemerSchema>;
export const RedeemerType = RedeemerSchema as unknown as RedeemerType;
