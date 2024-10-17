use aiken/interval.{before}
use auction/types.{AuctionerDatum, AuctionerRedeemer}
use auctioner
use cardano/address.{
  Address, Inline, VerificationKey, from_script, from_verification_key,
}
use cardano/assets
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
    assets.from_lovelace(2_000_000)
      |> assets.merge(assets.from_asset("PolicyID", "NFT", 1))
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

test auctioner_place_first_bid() {
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
    assets.from_lovelace(2_500_000)
      |> assets.merge(assets.from_asset("PolicyID", "NFT", 1))
  let input_utxo_script =
    Input(
      utxo,
      Output(from_verification_key("SSSS"), value, InlineDatum(datum), None),
    )
  let input_utxo_bidder =
    Input(
      utxo,
      Output(
        from_verification_key("AFDB"),
        assets.from_lovelace(55_000_000),
        NoDatum,
        None,
      ),
    )
  let output_utxo = Output(address, value, NoDatum, None)
  let tx_info =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: ["AFDB"],
      inputs: [input_utxo_script, input_utxo_bidder],
      outputs: [output_utxo],
      validity_range: before(20),
    }
  let redeemer = AuctionerRedeemer { action: 1, bid: 50, bidder_vkh: "AFDB" }
  auctioner.auctioner.spend(Some(datum), redeemer, utxo, tx_info)
}
// Interval { lower_bound: IntervalBound<a>, upper_bound: IntervalBound<a> }
