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


// Prepare wallets que hara el bid
const signingKey3 = await Deno.readTextFile("../wallets/test03.skey")

const address3 = await lucid
   .selectWalletFromPrivateKey(signingKey3)
   .wallet.address();
   const bidderPkh: string = await lucid.utils.getAddressDetails(address3).paymentCredential.hash;


// console.log(address2);
// console.log("---");
// console.log(bidderPkh);


// Read compiled contact validator from file 
const auctionValidator: SpendingValidator = await readNoParamsValidator("../../auction/plutus.json",0);
const auctionAddress: string = await lucid.utils.validatorToAddress(auctionValidator);


const nftPid = "d928bcb675e81baed8e7c66e136a6f92f340363d9601cc934a0d1670";
const nftTokenName =  "426f624d65636861";
const nftAsset = toUnit(nftPid, nftTokenName);

console.log(auctionValidator);
console.log("---");
console.log(auctionAddress);
console.log("---");
console.log(nftAsset);

const deadline = BigInt(1721396599773)

const previousDatumAuction = Data.to(new Constr (0, [[nftPid, nftTokenName, BigInt(1)],
                                    "37396a04dff5f5b48d1ab4f3f93fd95c3978a193bb280738a86d084f",
                                    BigInt(10000000),
                                    deadline, 
                                    BigInt(15000000),
                                    "5142a9162d7bf864d26dd22f5ed7f794d708e3d6972341e70a417cfa"]) );

//const revereseDatum = Data.from(datumBegin);

console.log("---");
console.log(previousDatumAuction);
// console.log("---");
// console.log(revereseDatum);



const foundUTxOs = await lucid.utxosAtWithUnit(auctionAddress,nftAsset);
  let utxo = foundUTxOs[0];
  utxo.datum = previousDatumAuction;

 if (!utxo) throw new Error("UTxO not found.");

 const utxos = [utxo];

 console.log(utxos);

const placeBid = async (daBid: number): Promise<Result<any>> => {

// const bidSchema = Data.Object({
//     "bidder": Data.String,
//     "amount": Data.BigInt,
//   });

// type RedeemerBid = Data.Static<typeof bidSchema>;
// const RedeemerBid = bidSchema as unknown as RedeemerBid;

const redeemerBid = Data.to(new Constr(0, [BigInt(0), BigInt(daBid), bidderPkh]));

// const redeemerBid = Data.to(new Constr(0, [
//                                           new Constr(0, [bidderPkh, BigInt(daBid)])
//                                           ]));

// UnConstrData:Con(Data(BigInt(Int(Int(Int {neg: false,val: 0,},),),),)

console.log(redeemerBid);
console.log("---");
//console.log(Data.from(redeemerBid));

 const newDatum = Data.to(new Constr (0, [[nftPid, nftTokenName, BigInt(1)],
                                          "37396a04dff5f5b48d1ab4f3f93fd95c3978a193bb280738a86d084f",
                                          BigInt(10000000),
                                          deadline, 
                                          BigInt(daBid),
                                          bidderPkh]) );
  console.log(newDatum);

  try {
    const tx: any = await lucid
      .newTx()
      .collectFrom(utxos, redeemerBid)
      .attachSpendingValidator(auctionValidator)
      .payToContract(auctionAddress, newDatum, {[nftAsset]: BigInt(1), lovelace: BigInt(2200000)})
      .validTo(Date.now() + 20000)
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
//     // const success = await lucid!.awaitTx(txHash)

//     console.log(tx);
//     console.log(signedTx);
//     // console.log(txHash);

     console.log("Placing bid...");
//    return { type: "ok", data: "ok" };
      return { type: "ok", data: txHash };

  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };
    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}

 const demo = await placeBid(25000000);
 console.log(demo);