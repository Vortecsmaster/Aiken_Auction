import { useEffect, useState } from "react";
import { Spinner } from "@nextui-org/spinner";
import { Snippet } from "@nextui-org/snippet";
import { Button } from "@nextui-org/button";
import { button as buttonStyles } from "@nextui-org/theme";
import {} from "@lucid-evolution/lucid";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { Wallet } from "@/types/cardano";

export default function WalletConnectors(props: { onError: (error: any) => void }) {
  const { onError } = props;

  const [walletConnection, setWalletConnection] = useWallet();
  const { lucid } = walletConnection;

  const [wallets, setWallets] = useState<Wallet[]>();

  useEffect(() => {
    const wallets: Wallet[] = [];

    const { cardano } = window;
    for (const c in cardano) {
      const wallet = cardano[c];
      if (!wallet.apiVersion) continue;
      wallets.push(wallet);
    }

    wallets.sort((l, r) => {
      return l.name.toUpperCase() < r.name.toUpperCase() ? -1 : 1;
    });
    setWallets(wallets);
  }, []);

  async function onConnectWallet(wallet: Wallet) {
    try {
      if (!lucid) throw "Uninitialized Lucid!!!";

      const api = await wallet.enable();
      lucid.selectWallet.fromAPI(api);

      const address = await lucid.wallet().address();
      setWalletConnection({ ...walletConnection, address, wallet });
    } catch (error) {
      onError(error);
    }
  }

  if (!wallets)
    return (
      <Snippet hideCopyButton hideSymbol variant="bordered">
        <Spinner label="Browsing Cardano Wallets" />
      </Snippet>
    );

  if (!wallets.length)
    return (
      <Snippet hideCopyButton hideSymbol variant="bordered">
        <p className="uppercase">No Cardano Wallet</p>
      </Snippet>
    );

  return (
    <div className="flex flex-col gap-4 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 2xl:w-1/6">
      {wallets.map((wallet, w) => (
        <Button
          key={`wallet.${w}`}
          onClick={() => onConnectWallet(wallet)}
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
            className: "capitalize",
          })}
        >
          {wallet.name}
        </Button>
      ))}
    </div>
  );
}
