import { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Spinner } from "@nextui-org/spinner";
import { Snippet } from "@nextui-org/snippet";
import { Link } from "@nextui-org/link";
import { Blockfrost, Lucid, Network } from "@lucid-evolution/lucid";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { handleError } from "@/components/utils";
import { title, subtitle } from "@/components/primitives";
import WalletConnectors from "@/components/pages/home/WalletConnectors";
import ConnectedDashboard from "@/components/pages/home/ConnectedDashboard";
import DisconnectButton from "@/components/pages/DisconnectButton";

export default function Home() {
  const [walletConnection, setWalletConnection] = useWallet();
  const { lucid, address } = walletConnection;

  useEffect(() => {
    if (lucid) return;

    const BF_URL = `${process.env.NEXT_PUBLIC_BF_URL}`;
    const BF_PID = `${process.env.NEXT_PUBLIC_BF_PID}`;

    const blockfrost = new Blockfrost(BF_URL, BF_PID);
    const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK as Network;

    Lucid(blockfrost, network)
      .then((lucid) =>
        setWalletConnection({
          ...walletConnection,
          lucid,
          blockfrost,
          network,
        })
      )
      .catch((error) => toast(`${error}`, { type: "error" }));
  }, []);

  if (address)
    return (
      <section className="relative flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <ConnectedDashboard />
        <DisconnectButton />
      </section>
    );

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      {/* Title */}
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Connect&nbsp;</span>
        <span className={title({ color: "violet" })}>Cardano&nbsp;</span>
        <span className={title()}>Wallet</span>
      </div>

      {/* Wallet Connectors */}
      <div className="flex justify-center mt-4 w-full">
        {lucid ? (
          <WalletConnectors onError={handleError} />
        ) : (
          <Snippet hideCopyButton hideSymbol variant="bordered">
            <Spinner label="Initializing Lucid" />
          </Snippet>
        )}
      </div>

      {/* Subtitle */}
      <div className="inline-block max-w-xl text-center justify-center">
        <div className={subtitle({ class: "mt-4" })}>
          See the{" "}
          <Link isExternal className="text-lg lg:text-xl" href="https://developers.cardano.org/showcase/?tags=wallet">
            list of wallets
          </Link>{" "}
          built for Cardano
        </div>
      </div>

      {/* Toast */}
      <ToastContainer theme="dark" position="bottom-right" />
    </section>
  );
}
