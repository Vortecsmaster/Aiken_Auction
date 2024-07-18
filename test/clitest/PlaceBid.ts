import {
    Blockfrost,
    C,
    Data,
    Lucid,
    MintingPolicy,
    SpendingValidator,
    PolicyId,
    TxHash,
    fromHex,
    toHex,
    Unit,
    toUnit,
    fromUnit,
    Constr,
    fromText,
  } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";
import {parametrizer, readValidator, readNoParamsValidator} from "../../src/utils/utils.ts";
import { Result } from "../../src/utils/types.ts";


//Start lucid object, selecting network and blockfrost api key.
const lucid: Lucid = await Lucid.new(
  new Blockfrost(
    "https://cardano-preview.blockfrost.io/api/v0",
    Deno.env.get("BLOCKFROST_API"),
  ),
  "Preview",
);


// Prepare wallets
const signingKey = await Deno.readTextFile("../wallets/test01.skey")

const adr01 = await lucid
   .selectWalletFromPrivateKey(signingKey)
   .wallet.address();

// console.log(adr01);


// Read compiled contact validator from file 
const auctionValidator: SpendingValidator = await readNoParamsValidator("../../auction/plutus.json",0);
const auctionAddress: string = await lucid.utils.validatorToAddress(auctionValidator)

console.log(auctionValidator);
console.log(auctionAddress);

const placeBid = async (): Promise<Result<any>> => {
  try {
    const tx: any = await lucid
      .newTx()
      .mintAssets({[titulos_dada]: BigInt(2),[notas_dada]: BigInt(2) }, mintRedeemer)
      .payToAddress(direccionEstudiante,{[titulos_dada]: BigInt(1), [notas_dada]: BigInt(1), lovelace: BigInt(13000000)})
      .payToContract(dadaValDireccion,datum,{[titulos_dada]: BigInt(1), [notas_dada]: BigInt(1), lovelace: BigInt(13000000)})
      .readFrom([UTxO{"7f0b814ab9b82ed88d7c115db86a9a5c1489dcb8c9bca6bf16300f1b2fc91dc7", 0}])
//      .attachMintingPolicy(dadaPM_TitulosyNotas)
      .attachMetadata("721", jsonData)
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    const success = await lucid!.awaitTx(txHash)

    console.log(tx);
    console.log(signedTx);
    console.log(txHash);
    return { type: "ok", data: txHash };

  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };
    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}


console.log("Placing bid...");

const demo = await placeBid();
console.log(demo);
