import { Button } from "@nextui-org/button";
import { useWallet } from "../contexts/wallet/WalletContext";
import { useSeller } from "../contexts/seller/SellerContext";

export default function DisconnectButton() {
  const [walletConnection, setWalletConnection] = useWallet();
  const [, setAuctionData] = useSeller();

  function disconnect() {
    setAuctionData({});
    setWalletConnection({ ...walletConnection, wallet: undefined, address: "" });
  }

  return (
    <Button className="absolute top-0 right-0 -translate-y-full" onClick={() => disconnect()}>
      Disconnect
    </Button>
  );
}
