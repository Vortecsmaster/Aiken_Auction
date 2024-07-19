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

const sellerAddress = await lucid
   .selectWalletFromPrivateKey(signingKey)
   .wallet.address();

console.log("Seller address: ")
console.log(sellerAddress);
console.log("---");
console.log("Seller pkh: ");
console.log(await lucid.utils.getAddressDetails(sellerAddress).paymentCredential.hash);

// Read compiled contact validator from file 
const auctionValidator: SpendingValidator = await readNoParamsValidator("../../auction/plutus.json",0);
const auctionAddress: string = await lucid.utils.validatorToAddress(auctionValidator);
const sellerPkh: string = await lucid.utils.getAddressDetails(sellerAddress).paymentCredential.hash;
// console.log("--- this one ---");
// console.log(sellerPkh);

const nftPid = "d928bcb675e81baed8e7c66e136a6f92f340363d9601cc934a0d1670";
const nftTokenName =  "426f624d65636861";
const nftAsset = toUnit(nftPid, nftTokenName);



console.log("Auction Validator");
console.log(auctionValidator);
console.log("---");
console.log(auctionAddress);
// console.log("---");
// console.log(sellerPkh);
// console.log("---");
// console.log(nftAsset);


const datumBegin = Data.to(new Constr (0, [[nftPid, nftTokenName, BigInt(1)],
                                            sellerPkh,
                                            BigInt(10000000),
                                            BigInt(Date.now() + 360000),  //10min from the moment of placing the bid
                                            BigInt(0),
                                            ""]) );

const revereseDatum = Data.from(datumBegin);

// console.log("---");
// console.log(datumBegin);
// console.log("---");
// console.log(revereseDatum);

const createAuction = async (): Promise<Result<any>> => {
  try {
    const tx: any = await lucid
      .newTx()
      .payToContract(auctionAddress, datumBegin, {[nftAsset]: BigInt(1), lovelace: BigInt(2200000)})
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    const success = await lucid!.awaitTx(txHash)

    console.log(tx);
    console.log(signedTx);
    console.log(txHash);

    console.log("Placing bid...");

    return { type: "ok", data: txHash };

  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };
    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}



const demo = await createAuction();
console.log(demo);