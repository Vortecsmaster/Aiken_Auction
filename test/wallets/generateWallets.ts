import {Lucid} from "https://deno.land/x/lucid@0.8.3/mod.ts";

const lucid = await Lucid.new(undefined, "Preview");

const privateKey = lucid.utils.generatePrivateKey();
await Deno.writeTextFile("testkey03.skey", privateKey);

const testaddr = await lucid
    .selectWalletFromPrivateKey(privateKey)
    .wallet.address();

 await Deno.writeTextFile("test03.addr", testaddr);
 