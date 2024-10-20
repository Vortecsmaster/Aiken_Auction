import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { Spinner } from "@nextui-org/spinner";
import { Snippet } from "@nextui-org/snippet";
import { DatePicker } from "@nextui-org/date-picker";
import { Chip } from "@nextui-org/chip";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { Data, getAddressDetails, toText } from "@lucid-evolution/lucid";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { getAsset } from "@/components/blockfrost";
import { handleError } from "@/components/utils";
import { spendAddress } from "@/components/script";
import { AuctionData, DatumType } from "@/types/cardano";
import NftAuction from "./NftAuction";
import BidNft from "./BidNft";
import CollectNft from "./CollectNft";

export default function AuctionList() {
  const [{ lucid, address }] = useWallet();

  const [auctionList, setAuctionList] = useState<AuctionData[]>();

  useEffect(() => {
    lookForAuctions();
  }, []);

  function lookForAuctions() {
    lucid
      ?.utxosAt(spendAddress)
      .then(async (utxos) => {
        const auctionList: AuctionData[] = [];
        for (const utxo of utxos) {
          const { assets } = utxo;

          const unit = `${Object.keys(assets).find((unit) => unit !== "lovelace")}`;
          const bf = await getAsset(unit);

          const policyID = bf.policy_id;
          const assetName = bf.onchain_metadata?.name ?? bf.metadata?.name ?? toText(unit.slice(56));
          const qty = assets[unit];

          const assetUTxO = { unit, policyID, assetName, qty, utxo, bf };
          const datum = Data.from(`${utxo.datum}`, DatumType);

          auctionList.push({ assetUTxO, datum });
        }

        auctionList.sort((l, r) => {
          const lEndTime = l.datum?.endTime ?? 0n;
          const rEndTime = r.datum?.endTime ?? 0n;
          return lEndTime - rEndTime < 0n ? -1 : 1;
        });
        setAuctionList(auctionList);
      })
      .catch(handleError);
  }

  if (!auctionList)
    return (
      <Snippet hideCopyButton hideSymbol variant="bordered">
        <Spinner label="Looking for Auctions" />
      </Snippet>
    );

  function formatLovelace(lovelace: bigint) {
    const str = "000000" + `${lovelace}`;
    return str.slice(str.length - 6);
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4 w-full">
      <Table isStriped>
        <TableHeader>
          <TableColumn className="text-center">NFT</TableColumn>
          <TableColumn className="text-center">End Time</TableColumn>
          <TableColumn className="text-center">Current Bid</TableColumn>
          <TableColumn className="text-center">Minimum Bid</TableColumn>
          <TableColumn className="text-center">Highest Bidder</TableColumn>
          <TableColumn className="text-center">Action</TableColumn>
        </TableHeader>
        <TableBody emptyContent="There's no Auction">
          {auctionList.map((auction, a) => {
            if (!address) return <></>;

            const pkh = `${getAddressDetails(address).paymentCredential?.hash}`;
            return (
              <TableRow key={`auction.${a}`}>
                {/* NFT */}
                <TableCell>
                  <NftAuction auction={auction} />
                </TableCell>

                {/* End Time */}
                <TableCell>
                  <DatePicker defaultValue={fromDate(new Date(parseInt(`${auction.datum?.endTime}`)), getLocalTimeZone())} variant="underlined" isReadOnly />
                </TableCell>

                {/* Current Bid */}
                <TableCell>
                  <div className="text-bold">
                    {`${BigInt(auction.datum?.currentBid ?? 0) / 1_000000n}`}.
                    <span className="text-xs text-default-400">{`${formatLovelace(BigInt(auction.datum?.currentBid ?? 0) % 1_000000n)}`}</span>
                  </div>
                </TableCell>

                {/* Minimum Bid */}
                <TableCell>
                  <div className="text-bold">
                    {`${BigInt(auction.datum?.minBid ?? 0) / 1_000000n}`}.
                    <span className="text-xs text-default-400">{`${formatLovelace(BigInt(auction.datum?.minBid ?? 0) % 1_000000n)}`}</span>
                  </div>
                </TableCell>

                {/* Highest Bidder */}
                <TableCell>
                  <Chip
                    className="uppercase border-none"
                    color={pkh === auction.datum?.bidderVKH ? "success" : auction.datum?.currentBid ? "danger" : "default"}
                    size="sm"
                    variant="dot"
                  >
                    {pkh === auction.datum?.bidderVKH ? "YOU" : auction.datum?.currentBid ? "other" : "N/A"}
                  </Chip>
                </TableCell>

                {/* Action */}
                <TableCell>
                  {pkh === auction.datum?.bidderVKH ? <CollectNft auction={auction} /> : <BidNft auction={auction} onRefresh={lookForAuctions} />}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
