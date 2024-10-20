import { createContext, useContext } from "react";
import { AuctionData } from "@/types/cardano";

export const SellerContext = createContext<[AuctionData, (auctionData: AuctionData) => void]>([{}, () => {}]);
export const useSeller = () => useContext(SellerContext);
