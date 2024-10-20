import { useEffect, useState } from "react";
import { getImgUrl } from "@/components/nftcdn";
import { handleError } from "@/components/utils";
import { AuctionData } from "@/types/cardano";
import { User } from "@nextui-org/user";

export default function NftAuction(props: { auction: AuctionData }) {
  const { auction } = props;
  const { assetUTxO } = auction;

  const { unit, policyID, assetName, qty, utxo, bf } = assetUTxO!;
  const assetFingerprint = `${bf.fingerprint}`;

  const [imgURL, setImgURL] = useState("");

  useEffect(() => {
    getImgUrl(assetFingerprint).then(setImgURL).catch(handleError);
  }, []);

  return <User avatarProps={{ radius: "lg", src: imgURL }} description={assetFingerprint} name={assetName} />;
}
