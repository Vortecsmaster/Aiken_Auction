import { useState } from "react";
import { Button } from "@nextui-org/button";
import { button as buttonStyles } from "@nextui-org/theme";
import { Assets, credentialToAddress, Data, fromText, getAddressDetails, keyHashToCredential, Network, toText, TxSignBuilder } from "@lucid-evolution/lucid";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { getLatestBlock } from "@/components/blockfrost";
import { handleError, handleSuccess } from "@/components/utils";
import { spendAddress, spendValidator } from "@/components/script";
import { AuctionData, DatumType, RedeemerType } from "@/types/cardano";

export default function BidNft(props: { auction: AuctionData; onRefresh: () => void }) {
  const { auction, onRefresh } = props;
  const { assetUTxO, datum } = auction;

  const { unit, policyID, assetName, qty, utxo, bf } = assetUTxO!;
  const { endTime } = datum!;

  const beforeDeadline = () => endTime > BigInt(new Date().getTime());
  const afterDeadline = () => !beforeDeadline();

  const [{ lucid, network, address }] = useWallet();

  const [isBidNotRefresh, setIsBidNotRefresh] = useState(true);

  /**
   * Bid an Auction
   * @returns tx
   */
  async function constructTx() {
    if (!lucid) throw "Uninitialized Lucid";
    if (!address) throw "Unconnected Wallet";

    const { paymentCredential, stakeCredential } = getAddressDetails(address);
    const bidderVKH = paymentCredential?.hash ?? "";
    const bidderDKH = stakeCredential?.hash ?? "";
    const prevBidderVKH = datum?.bidderVKH ?? "";

    let bidAmount = datum?.minBid ?? 0n;
    const prevBid = datum?.currentBid ?? 0n;
    if (prevBid > 0n) bidAmount = prevBid + prevBid / 100n;

    const redeemer: RedeemerType = { action: 1n, bidAmount, bidderVKH };
    const assets: Assets = {
      ...utxo.assets,
      lovelace: utxo.assets.lovelace - prevBid + bidAmount,
    };

    const { time } = await getLatestBlock();

    let newTx = lucid.newTx();
    newTx = newTx.addSigner(address);
    newTx = newTx.validFrom(time * 1_000);
    newTx = newTx.collectFrom([utxo], Data.to(redeemer, RedeemerType));
    newTx = newTx.attach.SpendingValidator(spendValidator);
    newTx = newTx.pay.ToContract(
      spendAddress,
      { kind: "inline", value: Data.to({ ...datum!, bidderVKH, bidderDKH, currentBid: bidAmount }, DatumType) },
      assets
    );

    if (prevBidderVKH) {
      const prevBidderPaymentCredential = keyHashToCredential(prevBidderVKH);
      const prevBidderStakeCredential = datum?.bidderDKH ? keyHashToCredential(datum.bidderDKH) : undefined;

      const prevBidderAddress = credentialToAddress(network as Network, prevBidderPaymentCredential, prevBidderStakeCredential);
      newTx = newTx.pay.ToAddress(prevBidderAddress, { lovelace: prevBid });
    }

    const tx = await newTx.complete();
    return tx;
  }

  async function submitTx(tx: TxSignBuilder) {
    const txSigned = await tx.sign.withWallet().complete();
    const txHash = await txSigned.submit();

    return txHash;
  }

  return (
    <Button
      onClick={() => {
        if (isBidNotRefresh) {
          constructTx()
            .then(submitTx)
            .then(handleSuccess)
            .then(() => setIsBidNotRefresh(false))
            .catch(handleError);
        } else {
          onRefresh();
          setIsBidNotRefresh(true);
        }
      }}
      className={buttonStyles({
        color: afterDeadline() ? "default" : isBidNotRefresh ? "primary" : "warning",
        radius: "full",
        variant: "shadow",
        className: "capitalize",
      })}
      isDisabled={afterDeadline()}
    >
      {afterDeadline() ? "Expired" : isBidNotRefresh ? "Bid" : "Refresh"}
    </Button>
  );
}
