import { Unit } from "@lucid-evolution/lucid";
import { req } from "./utils";

function fetchBlockfrost(path: string) {
  const blockfrost = `${process.env.NEXT_PUBLIC_BF_URL}`;
  const project_id = `${process.env.NEXT_PUBLIC_BF_PID}`;

  return req(`${blockfrost}/${path}`, {
    headers: { project_id },
  });
}

export function getAsset(unit: Unit) {
  return fetchBlockfrost(`assets/${unit}`);
}

export function getLatestBlock() {
  return fetchBlockfrost("blocks/latest");
}
