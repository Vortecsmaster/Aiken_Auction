use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval
use auction/types.{AuctionDatum, AuctionRedeemer}
use cardano/address
use cardano/assets.{Value}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}

/// The Auction Validator
///
/// Actions:
/// - 0: PlaceBid
/// - 1: PayOut
/// - 2: Cancel
validator auction {
  spend(
    auction_datum: Option<AuctionDatum>,
    user_action: AuctionRedeemer,
    target_output_ref: OutputReference,
    transaction: Transaction,
  ) {
    expect Some(auction_state) = auction_datum
    when user_action.action is {
      // PlaceBid:
      0 -> and {
          time_limit_not_reached(auction_state, transaction),
          when auction_state.current_bid is {
            // If first bid, must be at least min big specified in config:
            0 -> user_action.bid >= auction_state.min_bid

            _ -> and {
                // new bid is at least 1% higher than previous high:
                user_action.bid >= auction_state.current_bid + auction_state.current_bid / 100,
                // refunds the previous bidder:
                refunds_previous(
                  transaction.outputs,
                  auction_state,
                  user_action.bid,
                  user_action.bidder_pkh,
                ),
                // includes correct continuing output:
                valid_cont_output(
                  target_output_ref,
                  transaction,
                  assets.from_asset(
                    auction_state.asset_value.1st,
                    auction_state.asset_value.2nd,
                    auction_state.asset_value.3rd,
                  ),
                  user_action.bid,
                  user_action.bidder_pkh,
                ),
              }
          },
        }

      // PayOut:
      1 -> and {
          // End time has passed:
          !interval.contains(transaction.validity_range, auction_state.end_time),
          // Pays to the seller:
          pays_seller(transaction.outputs, auction_state),
          // Pays the asset to high bidder:
          pays_asset_value(
            transaction.outputs,
            assets.from_asset(
              auction_state.asset_value.1st,
              auction_state.asset_value.2nd,
              auction_state.asset_value.3rd,
            ),
            auction_state,
          ),
        }

      // Cancel | etc...
      _ -> False
    }
  }

  else(_) {
    fail
  }
}

fn pays_value(
  receiver_pkh: VerificationKeyHash,
  target_value: Value,
  outputs: List<Output>,
) -> Bool {
  // Look for a matching output that satisfies the helper
  let out: Output <- list.any(outputs)
  and {
    out.address == address.from_verification_key(receiver_pkh),
    out.value == target_value,
  }
}

fn pays_ada(
  bid_amt: Int,
  outputs: List<Output>,
  receiver_pkh: VerificationKeyHash,
) -> Bool {
  let bid_val = assets.from_lovelace(bid_amt)
  pays_value(receiver_pkh, bid_val, outputs)
}

fn refunds_previous(
  outputs: List<Output>,
  bid_state: AuctionDatum,
  bid: Int,
  bidder_pkh: VerificationKeyHash,
) -> Bool {
  when bid_state.current_bid is {
    0 -> True
    _ -> pays_ada(bid, outputs, bidder_pkh)
  }
}

fn pays_seller(outputs: List<Output>, bid_state: AuctionDatum) -> Bool {
  when bid_state.current_bid is {
    0 -> True
    _ -> pays_ada(bid_state.current_bid, outputs, bid_state.seller_pkh)
  }
}

fn pays_asset_value(
  outputs: List<Output>,
  asset_value: Value,
  // from_asset(policy_id: PolicyId, asset_name: AssetName, quantity: Int) -> Value
  bid_state: AuctionDatum,
) -> Bool {
  let recipient_pkh =
    when bid_state.current_bid is {
      0 -> bid_state.seller_pkh
      // If no bid, pay asset to seller
      // If bid, pay asset to current high bidder
      _ -> bid_state.bidder_pkh
    }
  pays_value(recipient_pkh, asset_value, outputs)
}

fn find_validating_input(
  target_output_ref: OutputReference,
  transaction: Transaction,
) -> Input {
  expect Some(input) =
    transaction.find_input(transaction.inputs, target_output_ref)

  // Now return the input:
  input
}

fn get_continuing_outputs(
  target_output_ref: OutputReference,
  transaction: Transaction,
) -> List<Output> {
  let input = find_validating_input(target_output_ref, transaction)
  let script_address = input.output.address

  // Back-passing:
  let out: Output <- list.filter(transaction.outputs)
  out.address == script_address
}

fn valid_cont_output(
  target_output_ref: OutputReference,
  transaction: Transaction,
  target_value: Value,
  target_bid: Int,
  target_bidder_pkh: VerificationKeyHash,
) -> Bool {
  expect [cont_output] = get_continuing_outputs(target_output_ref, transaction)

  // check correct continuing output value
  if cont_output.value == assets.merge(
    target_value,
    assets.from_lovelace(target_bid),
  ) {
    // check correct continuing output datum
    expect InlineDatum(new_auction_state) = cont_output.datum
    expect the_datum: AuctionDatum = new_auction_state

    and {
      (the_datum.bidder_pkh == target_bidder_pkh)?,
      (the_datum.current_bid == target_bid)?,
    }
  } else {
    // wrong value!
    False
  }
}

fn time_limit_not_reached(
  auction_state: AuctionDatum,
  transaction: Transaction,
) -> Bool {
  transaction.validity_range
    |> interval.contains(auction_state.end_time)
}
