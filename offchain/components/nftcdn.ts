"use server";

import { createHmac } from "crypto";

const domain = `${process.env.NEXT_PUBLIC_CARDANO_NETWORK}`.toLowerCase();
const key = Uint8Array.from(Buffer.from(`${process.env.NEXT_PUBLIC_NFTCDN_KEY}`, "base64"));

function buildUrl(fingerprint: string, path: string, params: Record<string, any>) {
  const searchParams = new URLSearchParams(params);
  return `https://${fingerprint}.${domain}.nftcdn.io${path}?${searchParams.toString()}`;
}

function nftcdnUrl(fingerprint: string, path: string, params: Record<string, any> = {}) {
  params.tk = "";
  let url = buildUrl(fingerprint, path, params);

  params.tk = createHmac("sha256", key).update(url).digest("base64url");
  return buildUrl(fingerprint, path, params);
}

export async function getImgUrl(fingerprint: string, size: number = 256) {
  return nftcdnUrl(fingerprint, "/image", { size });
}
