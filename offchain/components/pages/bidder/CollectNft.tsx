import { useState } from "react";
import { Button } from "@nextui-org/button";
import { button as buttonStyles } from "@nextui-org/theme";
import { credentialToAddress, Data, keyHashToCredential, Network, TxSignBuilder } from "@lucid-evolution/lucid";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { getLatestBlock } from "@/components/blockfrost";
import { handleError, handleSuccess } from "@/components/utils";
import { spendValidator } from "@/components/script";
import { AuctionData, RedeemerType } from "@/types/cardano";

export default function CollectNft(props: { auction: AuctionData }) {
  const { auction } = props;
  const { assetUTxO, datum } = auction;

  const { unit, policyID, assetName, qty, utxo, bf } = assetUTxO!;
  const { endTime, currentBid, sellerVKH, sellerDKH } = datum!;

  const [{ lucid, network, address }] = useWallet();

  const [isCollected, setIsCollected] = useState(false);

  const beforeDeadline = () => parseInt(`${endTime}`) > new Date().getTime();

  /**
   * Collect an NFT
   * @returns tx
   */
  async function constructTx() {
    if (!lucid) throw "Uninitialized Lucid";
    if (!address) throw "Unconnected Wallet";

    const sellerPaymentCredential = keyHashToCredential(sellerVKH);
    const sellerStakeCredential = sellerDKH ? keyHashToCredential(sellerDKH) : undefined;
    const sellerAddress = credentialToAddress(network as Network, sellerPaymentCredential, sellerStakeCredential);

    const redeemer: RedeemerType = { action: 2n, bidAmount: 0n, bidderVKH: "" };

    const { time } = await getLatestBlock();

    const tx = await lucid
      .newTx()
      .addSigner(address)
      .validFrom(time * 1_000)
      .collectFrom([utxo], Data.to(redeemer, RedeemerType))
      .attach.SpendingValidator(spendValidator)
      .pay.ToAddress(sellerAddress, { lovelace: currentBid })
      .complete();
    return tx;
  }

  async function submitTx(tx: TxSignBuilder) {
    const txSigned = await tx.sign.withWallet().complete();
    const txHash = await txSigned.submit();

    return txHash;
  }

  return (
    <Button
      onClick={() =>
        constructTx()
          .then(submitTx)
          .then(handleSuccess)
          .then(() => setIsCollected(true))
          .catch(handleError)
      }
      className={buttonStyles({
        color: beforeDeadline() || isCollected ? "default" : "success",
        radius: "full",
        variant: "shadow",
        className: "capitalize",
      })}
      isDisabled={beforeDeadline() || isCollected}
    >
      {isCollected ? "Collected" : "Collect"}
    </Button>
  );
}
