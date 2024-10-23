import { useEffect, useState } from "react";
import { handleError, handleSuccess } from "@/components/utils";
import Image from "next/image";
import { Spinner } from "@nextui-org/spinner";
import { Input } from "@nextui-org/input";
import { DatePicker } from "@nextui-org/date-picker";
import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { credentialToAddress, Data, keyHashToCredential, Network, TxSignBuilder } from "@lucid-evolution/lucid";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { useSeller } from "@/components/contexts/seller/SellerContext";
import { getLatestBlock } from "@/components/blockfrost";
import { getImgUrl } from "@/components/nftcdn";
import { spendAddress, spendValidator } from "@/components/script";
import { subtitle } from "@/components/primitives";
import { RedeemerType } from "@/types/cardano";

export default function Auction() {
  const [{ assetUTxO, datum }, setAuctionData] = useSeller();
  const { endTime, bidderVKH, bidderDKH, currentBid, minBid } = datum!;
  const { unit, policyID, assetName, qty, utxo, bf } = assetUTxO!;
  const assetFingerprint = `${bf.fingerprint}`;

  const [{ lucid, network, address }] = useWallet();

  const [imgURL, setImgURL] = useState("");

  useEffect(() => {
    getImgUrl(assetFingerprint).then(setImgURL).catch(handleError);
  }, []);

  /**
   * Cancel an Auction
   * @returns tx
   */
  async function constructTx() {
    if (!lucid) throw "Uninitialized Lucid";
    if (!address) throw "Unconnected Wallet";

    const utxos = utxo.datum ? [utxo] : await lucid.utxosAtWithUnit(spendAddress, unit);

    const redeemer: RedeemerType = { action: 0n, bidAmount: 0n, bidderVKH: "" };

    const { time } = await getLatestBlock();

    let newTx = lucid.newTx();
    newTx = newTx.addSigner(address);
    newTx = newTx.validFrom(time * 1_000);
    newTx = newTx.collectFrom(utxos, Data.to(redeemer, RedeemerType));
    newTx = newTx.attach.SpendingValidator(spendValidator);

    if (bidderVKH) {
      const bidderPaymentCredential = keyHashToCredential(bidderVKH);
      const bidderStakeCredential = bidderDKH ? keyHashToCredential(bidderDKH) : undefined;

      const bidderAddress = credentialToAddress(network as Network, bidderPaymentCredential, bidderStakeCredential);
      newTx = newTx.pay.ToAddress(bidderAddress, { lovelace: currentBid });
    }

    const tx = await newTx.complete();
    return tx;
  }

  async function submitTx(tx: TxSignBuilder) {
    const txSigned = await tx.sign.withWallet().complete();
    const txHash = await txSigned.submit();

    setAuctionData({ hasAuction: false });
    return txHash;
  }

  return (
    <div className="flex flex-row-reverse gap-4 items-end">
      <div className="w-fit">
        <Card isFooterBlurred radius="lg" className="border-none">
          {imgURL ? (
            <Image src={imgURL} alt={assetFingerprint} width={200} height={200} className="object-cover" />
          ) : (
            <div className="flex flex-col justify-center items-center size-[200px]">
              <Spinner className="-translate-y-1/2" />
            </div>
          )}
          <CardFooter className="absolute bottom-0 z-10">
            <Button
              onClick={() => constructTx().then(submitTx).then(handleSuccess).catch(handleError)}
              color={currentBid == 0n ? "danger" : "default"}
              isDisabled={currentBid != 0n}
              radius="sm"
              size="sm"
              fullWidth
            >
              Cancel Auction
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="flex flex-col justify-end">
        <div className={subtitle({ className: "px-4" })}>
          You're auctioning: <span className="font-bold">{assetName}</span>
        </div>
        <Card>
          <CardHeader>
            <DatePicker label="End Time" defaultValue={fromDate(new Date(parseInt(endTime.toString())), getLocalTimeZone())} variant="underlined" isReadOnly />
          </CardHeader>
          <CardBody>
            <div className="flex gap-4 w-full">
              <div className="grow">
                <Input
                  type="number"
                  label="Current Bid"
                  labelPlacement="inside"
                  value={`${currentBid / 1_000000n}.${currentBid % 1_000000n}`}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">ADA</span>
                    </div>
                  }
                  radius="sm"
                  readOnly
                />
              </div>
              <div className="flex flex-col justify-center">/</div>
              <div className="shrink">
                <Input
                  type="number"
                  label="Minimum Bid"
                  labelPlacement="inside"
                  value={`${minBid / 1_000000n}.${minBid % 1_000000n}`}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">ADA</span>
                    </div>
                  }
                  radius="sm"
                  readOnly
                />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
