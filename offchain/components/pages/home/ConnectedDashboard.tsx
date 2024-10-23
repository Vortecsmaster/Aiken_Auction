import { Snippet } from "@nextui-org/snippet";
import { button as buttonStyles } from "@nextui-org/theme";
import { Link } from "@nextui-org/link";
import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { subtitle, title } from "@/components/primitives";

export default function ConnectedDashboard() {
  const [{ wallet, address }] = useWallet();

  return (
    <div className="flex flex-col text-center justify-center">
      {/* Title */}
      <h1 className={title()}>
        Welcome, <span className={title({ color: "violet", className: "capitalize" })}>{wallet?.name}</span> is Connected!
      </h1>

      {/* Subtitle */}
      <div className="mx-auto mt-4">
        <Snippet hideSymbol variant="bordered">
          {address}
        </Snippet>
      </div>

      {/* Choice */}
      <Snippet hideCopyButton hideSymbol className="w-fit mx-auto mt-8">
        <div className={subtitle()}>Now, you can go to...</div>
        <div className="flex justify-center gap-4 pb-2 w-full">
          <Link
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
              className: "w-fit",
            })}
            href="/seller"
          >
            Seller Dashboard
          </Link>
          <div className="my-auto">or</div>
          <Link className={buttonStyles({ variant: "bordered", radius: "full" })} href="/bidder">
            Bidder Dashboard
          </Link>
        </div>
      </Snippet>
    </div>
  );
}
