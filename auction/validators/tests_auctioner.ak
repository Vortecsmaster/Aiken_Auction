use auction/types.{AuctionerDatum, AuctionerRedeemer}
use auctioner
use cardano/transaction.{OutputReference, Transaction}

test auctioner_cancel_auction() {
  let tx_info =
    Transaction { ..transaction.placeholder, extra_signatories: ["VKH1"] }
  let utxo = OutputReference("", 0)
  let datum =
    AuctionerDatum {
      asset_value: ("PID", "tokenName", 1),
      seller_vkh: "AFDA",
      min_bid: 50,
      end_time: 100,
      current_bid: 0,
      bidder_vkh: "AFDB",
    }
  let redeemer = AuctionerRedeemer { action: 0, bid: 0, bidder_vkh: "AFDB" }

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
