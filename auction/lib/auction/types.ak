use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{AssetName, PolicyId}

/// Auction Datum
pub type AuctionDatum {
  asset_value: (PolicyId, AssetName, Int),
  seller_pkh: VerificationKeyHash,
  min_bid: Int,
  end_time: Int,
  current_bid: Int,
  bidder_pkh: VerificationKeyHash,
}

/// Redeemer representing user action
pub type AuctionRedeemer {
  action: Int,
  bid: Int,
  bidder_pkh: VerificationKeyHash,
}
