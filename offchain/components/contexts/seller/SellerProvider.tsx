"use client";

import { useState } from "react";
import { AuctionData } from "@/types/cardano";
import { SellerContext } from "./SellerContext";

export default function SellerProvider(props: { children: React.ReactNode }) {
  return <SellerContext.Provider value={useState<AuctionData>({})}>{props.children}</SellerContext.Provider>;
}
