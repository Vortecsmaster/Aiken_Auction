"use client";

import dynamic from "next/dynamic";

const Bidder = dynamic(() => import("./Bidder"), { ssr: false });

export default function Client() {
  return <Bidder />;
}
