"use client";

import dynamic from "next/dynamic";

const Seller = dynamic(() => import("./Seller"), { ssr: false });

export default function Client() {
  return <Seller />;
}
