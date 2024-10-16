use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{AssetName, PolicyId}

/// Auction Datum
pub type AuctionerDatum {
  asset_value: (PolicyId, AssetName, Int),
  seller_vkh: VerificationKeyHash,
  min_bid: Int,
  end_time: Int,
  current_bid: Int,
  bidder_vkh: VerificationKeyHash,
}

/// Redeemer representing user action
/// Actions:
/// - 0: Cancel Auction - Tx2
/// - 1: PlaceBid - Tx3, Tx4
/// - 2: Payout, Tx5
/// 
pub type AuctionerRedeemer {
  action: Int,
  bid: Int,
  bidder_vkh: VerificationKeyHash,
}
