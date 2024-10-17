use auction/types.{AuctionerDatum, AuctionerRedeemer}
use auctioner
use cardano/address.{Address, Inline, VerificationKey, from_script}
use cardano/assets.{from_asset_list}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Transaction,
}

test auctioner_cancel_auction() {
  let utxo = OutputReference("", 0)
  let address =
    Address {
      payment_credential: VerificationKey("VKH1"),
      stake_credential: Some(Inline(VerificationKey("VKH2"))),
    }
  let datum =
    AuctionerDatum {
      asset_value: ("PolicyID", "NFT", 1),
      seller_vkh: "VKH1",
      seller_address: address,
      min_bid: 50,
      end_time: 100,
      current_bid: 0,
      bidder_vkh: "AFDB",
    }
  let value =
    from_asset_list(
      [Pair("", [Pair("", 0)]), Pair("PolicyID", [Pair("NFT", 1)])],
    )
  let input_utxo =
    Input(utxo, Output(from_script("SSSS"), value, InlineDatum(datum), None))
  let output_utxo = Output(address, value, NoDatum, None)
  let tx_info =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: ["VKH1"],
      inputs: [input_utxo],
      outputs: [output_utxo],
    }

  let redeemer = AuctionerRedeemer { action: 0, bid: 0, bidder_vkh: "" }

  auctioner.auctioner.spend(Some(datum), redeemer, utxo, tx_info)
}
// test cancel_auction() {
//   let auction_datum = Some(AuctionerDatum(
//     (PolicyId("policy"), AssetName("asset"), 100),
//     VerificationKeyHash("seller"),
//     100,
//     1000,
//     0,
//     VerificationKeyHash("bidder"),
//   ))
//   let auctioner_redeemer = AuctionerRedeemer(
//     0,
//     0,
//     VerificationKeyHash("seller"),
//     (PolicyId("policy"), AssetName("asset")),
//     VerificationKeyHash("bidder"),
//   )
// let target_output_ref = OutputReference(0, 0)

// let tx_info = Transaction(
//   [],

//   auctioner.spend(auction_datum, 
//     auction_datum: Option<AuctionerDatum>,
//     user_action: AuctionerRedeemer,
//     target_output_ref: OutputReference,
//     transaction: Transaction,
//   )
// }
