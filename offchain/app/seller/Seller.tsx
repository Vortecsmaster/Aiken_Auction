import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { Spinner } from "@nextui-org/spinner";
import { Snippet } from "@nextui-org/snippet";
import { Data, getAddressDetails, toText } from "@lucid-evolution/lucid";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { useSeller } from "@/components/contexts/seller/SellerContext";
import { getAsset } from "@/components/blockfrost";
import { spendAddress } from "@/components/script";
import { title } from "@/components/primitives";
import Auction from "@/components/pages/seller/Auction";
import NftList from "@/components/pages/seller/NftList";
import DisconnectButton from "@/components/pages/DisconnectButton";
import { AuctionData, DatumType } from "@/types/cardano";

export default function Seller() {
  const router = useRouter();
  const [{ lucid, address }] = useWallet();
  const [{ hasAuction }, setAuctionData] = useSeller();

  useEffect(() => {
    findAuction()
      .then(setAuctionData)
      .catch(() => setAuctionData({ hasAuction: false }));
  }, []);

  useEffect(() => {
    if (!address) router.replace("/");
  }, [address]);

  async function findAuction() {
    if (!lucid) throw "Uninitialized Lucid";
    if (!address) throw "Unconnected Wallet";

    const utxos = await lucid.utxosAt(spendAddress);
    if (!utxos.length) throw "No Auction";

    let auctionDatum: DatumType | undefined;
    const pkh = `${getAddressDetails(address).paymentCredential?.hash}`;
    const utxo = utxos.find((utxo) => {
      const datum = Data.from(`${utxo.datum}`, DatumType);
      if (datum.sellerVKH === pkh) {
        auctionDatum = datum;
        return true;
      } else {
        return false;
      }
    });

    if (!utxo) throw "No Auction by the Connected Wallet";

    const { assets } = utxo;
    const unit = `${Object.keys(assets).find((unit) => unit !== "lovelace")}`;
    const bf = await getAsset(unit);

    const policyID = bf.policy_id;
    const assetName = bf.onchain_metadata?.name ?? bf.metadata?.name ?? toText(unit.slice(56));
    const qty = 1n;

    const auctionData: AuctionData = {
      assetUTxO: { unit, policyID, assetName, qty, bf, utxo },
      datum: auctionDatum,
      hasAuction: true,
    };
    return auctionData;
  }

  return (
    <>
      {/* Title */}
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>
          <span className={title({ color: "violet" })}>Seller</span> Dashboard
        </h1>
      </div>

      <div className="mt-4">
        {hasAuction == undefined ? (
          <Snippet hideCopyButton hideSymbol variant="bordered">
            <Spinner label="Looking for Auction" />
          </Snippet>
        ) : hasAuction ? (
          // Has Auction: Show Auction
          <Auction />
        ) : (
          // No Auction: Show NFT List
          <div className="flex flex-col items-center gap-2">
            <p>You have no auction, select an NFT to put on auction:</p>
            <div className="w-fit">
              <NftList />
            </div>
          </div>
        )}
      </div>

      <ToastContainer theme="dark" position="bottom-right" />
      <DisconnectButton />
    </>
  );
}
