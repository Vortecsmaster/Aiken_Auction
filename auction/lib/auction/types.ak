use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{AssetName, Lovelace, PolicyId}

/// A number of milliseconds since 00:00:00 UTC on 1 January 1970
pub type PosixTime =
  Int

/// Auction Datum
pub type AuctionerDatum {
  asset_value: (PolicyId, AssetName, Int),
  /// Payment part
  seller_vkh: VerificationKeyHash,
  /// Staking part
  seller_dkh: VerificationKeyHash,
  min_bid: Lovelace,
  end_time: PosixTime,
  current_bid: Lovelace,
  /// Payment part
  bidder_vkh: VerificationKeyHash,
  /// Staking part
  bidder_dkh: VerificationKeyHash,
}

/// Redeemer representing user action
///
/// Actions:
/// - 0: Cancel Auction - Tx2
/// - 1: PlaceBid - Tx3, Tx4
/// - 2: Payout, Tx5
pub type AuctionerRedeemer {
  action: Int,
  bid: Int,
  bidder_vkh: VerificationKeyHash,
}
