import { useEffect, useState } from "react";
import { Spinner } from "@nextui-org/spinner";
import { Snippet } from "@nextui-org/snippet";
import { toText, Unit } from "@lucid-evolution/lucid";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { getAsset } from "@/components/blockfrost";
import { handleError } from "@/components/utils";
import { AssetUTxO } from "@/types/cardano";
import NftCard from "./NftCard";

export default function NftList() {
  const [{ lucid }] = useWallet();

  const [assetUTXOs, setAssetUTXOs] = useState<AssetUTxO[]>();

  useEffect(() => {
    lucid
      ?.wallet()
      .getUtxos()
      .then(async (utxos) => {
        let walletAssets: Record<Unit, AssetUTxO> = {};
        for (const utxo of utxos) {
          const { assets } = utxo;
          for (const asset in assets) {
            const qty = assets[asset];
            if (qty == 1n) {
              walletAssets = {
                ...walletAssets,
                [asset]: {
                  unit: asset,
                  policyID: asset.slice(0, 56),
                  assetName: toText(asset.slice(56)),
                  qty: (walletAssets[asset]?.qty ?? 0n) + qty,
                  bf: {},
                  utxo,
                },
              };
            }
          }
        }

        const nfts: AssetUTxO[] = [];
        for (const asset in walletAssets) {
          const assetUTxO = walletAssets[asset];
          if (assetUTxO.qty == 1n) {
            const bf = await getAsset(assetUTxO.unit);

            const policyID = bf.policy_id;
            const assetName = bf.onchain_metadata?.name ?? bf.metadata?.name ?? assetUTxO.assetName;

            nfts.push({
              ...assetUTxO,
              policyID,
              assetName,
              bf,
            });
          }
        }

        nfts.sort((l, r) => {
          return l.assetName.toUpperCase() < r.assetName.toUpperCase() ? -1 : 1;
        });
        setAssetUTXOs(nfts);
      })
      .catch(handleError);
  }, []);

  if (!assetUTXOs)
    return (
      <Snippet hideCopyButton hideSymbol variant="bordered">
        <Spinner label="Browsing wallet NFTs" />
      </Snippet>
    );

  if (!assetUTXOs.length)
    return (
      <Snippet hideCopyButton hideSymbol variant="bordered">
        <p className="uppercase">Found no NFT</p>
      </Snippet>
    );

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4 w-full">
      {assetUTXOs.map((assetUTxO, a) => (
        <NftCard key={`assetUTxO.${a}`} assetUTxO={assetUTxO} />
      ))}
    </div>
  );
}
