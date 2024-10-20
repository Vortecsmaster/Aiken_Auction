import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { title } from "@/components/primitives";
import AuctionList from "@/components/pages/bidder/AuctionList";
import DisconnectButton from "@/components/pages/DisconnectButton";

export default function Bidder() {
  const router = useRouter();
  const [{ address }] = useWallet();

  useEffect(() => {
    if (!address) router.replace("/");
  }, [address]);

  return (
    <>
      {/* Title */}
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>
          <span className={title({ color: "violet" })}>Bidder</span> Dashboard
        </h1>
      </div>

      <div className="mt-4">
        <AuctionList />
      </div>

      <ToastContainer theme="dark" position="bottom-right" />
      <DisconnectButton />
    </>
  );
}
