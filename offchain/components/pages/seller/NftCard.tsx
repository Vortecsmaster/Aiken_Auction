import { useEffect, useState } from "react";
import Image from "next/image";
import { Spinner } from "@nextui-org/spinner";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/modal";
import { Input } from "@nextui-org/input";
import { DatePicker } from "@nextui-org/date-picker";
import { Card, CardFooter } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { CalendarDate, CalendarDateTime, getLocalTimeZone, now, ZonedDateTime } from "@internationalized/date";
import { Assets, Data, getAddressDetails, Lovelace, TxSignBuilder } from "@lucid-evolution/lucid";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { useSeller } from "@/components/contexts/seller/SellerContext";
import { getLatestBlock } from "@/components/blockfrost";
import { handleError, handleSuccess } from "@/components/utils";
import { getImgUrl } from "@/components/nftcdn";
import { spendAddress } from "@/components/script";
import { AssetUTxO, DatumType } from "@/types/cardano";

export default function NftCard(props: { assetUTxO: AssetUTxO }) {
  const { assetUTxO } = props;
  const { unit, policyID, assetName, qty, utxo, bf } = assetUTxO;
  const assetFingerprint = `${bf.fingerprint}`;

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [{ lucid, address }] = useWallet();
  const [, setAuctionData] = useSeller();

  const [imgURL, setImgURL] = useState("");

  const [minBid, setMinBid] = useState<Lovelace>(0n);
  const [endTime, setEndTime] = useState<EpochTimeStamp>(0);

  const [minBidErrMsg, setMinBidErrMsg] = useState("Invalid Amount");
  const [endTimeDefaultValue, setEndTimeDefaultValue] = useState(now(getLocalTimeZone()));

  const [isInvalidMinBid, setIsInvalidMinBid] = useState(true);
  const [isInvalidEndTime, setIsInvalidEndTime] = useState(true);

  useEffect(() => {
    getImgUrl(assetFingerprint).then(setImgURL).catch(handleError);
  }, []);

  useEffect(() => {
    if (!isInvalidMinBid) setMinBidErrMsg("Invalid Amount");
  }, [isInvalidMinBid]);

  function onModalOpen() {
    setEndTimeDefaultValue(now(getLocalTimeZone()));
    onOpen();
  }

  function onMinBidChange(minBid: string) {
    let lovelace = 0n;
    let isInvalidMinBid = false;
    try {
      if (minBid.length == 0) throw "Minimum Bid cannot be Empty";
      if (minBid.includes(".") && minBid.split(".")[1].length > 6) throw "Invalid Lovelace";

      const float = parseFloat(minBid);
      lovelace = BigInt(1_000000 * float);
    } catch (error) {
      setMinBidErrMsg(`${error}`);
      isInvalidMinBid = true;
    } finally {
      isInvalidMinBid = lovelace < 1n;
    }

    setIsInvalidMinBid(isInvalidMinBid);
    if (!isInvalidMinBid) setMinBid(lovelace);
  }

  function onEndTimeChange(endTime: ZonedDateTime | CalendarDate | CalendarDateTime) {
    const isInvalidEndTime = endTime.compare(endTimeDefaultValue) < 0;

    setIsInvalidEndTime(isInvalidEndTime);
    if (!isInvalidEndTime) setEndTime(endTime.toDate(getLocalTimeZone()).getTime());
  }

  /**
   * Put an NFT to Auction
   * @returns tx
   */
  async function constructTx(): Promise<{ tx: TxSignBuilder; assetUTxO: AssetUTxO; datum: DatumType }> {
    if (!lucid) throw "Uninitialized Lucid";
    if (!address) throw "Unconnected Wallet";

    const { paymentCredential, stakeCredential } = getAddressDetails(address);
    const sellerVKH = paymentCredential?.hash ?? "";
    const sellerDKH = stakeCredential?.hash ?? "";

    const assetValue = [policyID, bf.asset_name, 1n];
    const currentBid = 0n;
    const bidderVKH = "";
    const bidderDKH = "";

    const datum: DatumType = { assetValue, sellerVKH, sellerDKH, minBid, endTime: BigInt(endTime), currentBid, bidderVKH, bidderDKH };
    const assets: Assets = { [unit]: qty };

    const { time } = await getLatestBlock();

    const tx = await lucid
      .newTx()
      .addSigner(address)
      .validFrom(time * 1_000)
      .collectFrom([utxo])
      .pay.ToContract(spendAddress, { kind: "inline", value: Data.to(datum, DatumType) }, assets)
      .complete();
    return {
      tx,
      assetUTxO: {
        ...assetUTxO,
        utxo: { address: spendAddress, assets, outputIndex: 0, txHash: "" },
      },
      datum,
    };
  }

  async function submitTx({ tx, assetUTxO, datum }: { tx: TxSignBuilder; assetUTxO: AssetUTxO; datum: DatumType }) {
    const txSigned = await tx.sign.withWallet().complete();
    const txHash = await txSigned.submit();

    setAuctionData({
      assetUTxO: {
        ...assetUTxO,
        utxo: {
          ...assetUTxO.utxo,
          txHash,
        },
      },
      datum,
      hasAuction: true,
    });
    return txHash;
  }

  return (
    <>
      <Card isFooterBlurred radius="lg" className="border-none">
        {imgURL ? (
          <Image src={imgURL} alt={assetFingerprint} width={200} height={200} className="object-cover" />
        ) : (
          <div className="flex flex-col justify-center items-center size-[200px]">
            <Spinner className="-translate-y-1/2" />
          </div>
        )}
        <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden p-1 absolute before:rounded-lg rounded-medium bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
          <p className="text-tiny text-white/80">{assetName}</p>
          <Button onClick={onModalOpen} color="success" radius="sm" size="sm">
            Auction
          </Button>
        </CardFooter>
      </Card>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{assetName}</ModalHeader>
              <ModalBody>
                <Input
                  type="number"
                  label="Minimum Bid"
                  placeholder="0.000000"
                  labelPlacement="inside"
                  errorMessage={minBidErrMsg}
                  isInvalid={isInvalidMinBid}
                  min={0}
                  onValueChange={onMinBidChange}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">ADA</span>
                    </div>
                  }
                  variant="bordered"
                  isRequired
                  autoFocus
                />
                <DatePicker
                  label="End Time"
                  minValue={endTimeDefaultValue.add({ minutes: 1 })}
                  defaultValue={endTimeDefaultValue}
                  onChange={onEndTimeChange}
                  variant="bordered"
                  isRequired
                />
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isDisabled={isInvalidMinBid || isInvalidEndTime}
                  onPress={() => constructTx().then(submitTx).then(handleSuccess).catch(handleError).finally(onClose)}
                >
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
