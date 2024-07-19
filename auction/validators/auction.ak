use aiken/interval.{contains}
use aiken/list.{any, filter}
use aiken/time.{PosixTime}
use aiken/transaction.{
  InlineDatum, Input, Output, ScriptContext, Spend, find_input,
}
use aiken/transaction/credential.{from_verification_key}
use aiken/transaction/value.{
  AssetName, PolicyId, Value, from_asset, from_lovelace, merge,
}
use auction/types.{PubKeyHash}

type Bid {
  bidder_pkh: PubKeyHash,
  bid_amt: Int,
}

type AuctionDatum {
  asset_value: (PolicyId, AssetName, Int),
  seller_pkh: PubKeyHash,
  min_bid: Int,
  end_time: PosixTime,
  current_bid: Option<Bid>,
}

// Redeemer representing user action
type Redeemer {
  PlaceBid(Bid)
  PayOut
}

// The auction validator
validator {
  fn auction(
    auction_state: AuctionDatum,
    user_action: Redeemer,
    ctx: ScriptContext,
  ) -> Bool {
    when user_action is {
      PlaceBid(new_bid) ->
        timelimit_not_reached(auction_state, ctx) && when
          auction_state.current_bid
        is {
          // If first bid, must be at least min big specified in config
          None -> new_bid.bid_amt >= auction_state.min_bid
          Some(curr_bid) ->
            // new bid is at least 1% higher than previous high
            new_bid.bid_amt >= curr_bid.bid_amt + curr_bid.bid_amt / 100 && // refunds the previous bidder
            refunds_previous(ctx.transaction.outputs, auction_state) && // includes correct continuing output
            valid_cont_output(
              ctx,
              from_asset(
                auction_state.asset_value.1st,
                auction_state.asset_value.2nd,
                auction_state.asset_value.3rd,
              ),
              new_bid,
            )
        }
      PayOut ->
        // End time has passed
        contains(ctx.transaction.validity_range, auction_state.end_time) && // Pays to the seller
        pays_seller(
          ctx.transaction.outputs,
          auction_state.seller_pkh,
          auction_state,
        ) && // Pays the asset to high bidder
        pays_asset_value(
          ctx.transaction.outputs,
          auction_state.seller_pkh,
          from_asset(
            auction_state.asset_value.1st,
            auction_state.asset_value.2nd,
            auction_state.asset_value.3rd,
          ),
          auction_state,
        )
    }
  }
}

fn pays_value(
  receiver_pkh: PubKeyHash,
  target_value: Value,
  outputs: List<Output>,
) -> Bool {
  // Look for a matching output that satisfies the helper
  any(
    outputs,
    fn(out: Output) -> Bool {
      out.address == from_verification_key(receiver_pkh) && out.value == target_value
    },
  )
}

fn pays_ada(
  bid_amt: Int,
  outputs: List<Output>,
  receiver_pkh: PubKeyHash,
) -> Bool {
  let bid_val = from_lovelace(bid_amt)
  pays_value(receiver_pkh, bid_val, outputs)
}

fn refunds_previous(outputs: List<Output>, bid_state: AuctionDatum) -> Bool {
  when bid_state.current_bid is {
    Some(bid) -> pays_ada(bid.bid_amt, outputs, bid.bidder_pkh)
    None -> True
  }
}

fn pays_seller(
  outputs: List<Output>,
  seller_pkh: PubKeyHash,
  bid_state: AuctionDatum,
) -> Bool {
  when bid_state.current_bid is {
    Some(bid) -> pays_ada(bid.bid_amt, outputs, seller_pkh)
    None -> True
  }
}

fn pays_asset_value(
  outputs: List<Output>,
  seller_pkh: PubKeyHash,
  asset_value: Value,
  // from_asset(policy_id: PolicyId, asset_name: AssetName, quantity: Int) -> Value
  bid_state: AuctionDatum,
) -> Bool {
  let recipient_pkh =
    when bid_state.current_bid is {
      // If bid, pay asset to current high bidder
      Some(bid) -> bid.bidder_pkh
      // Else seller reclaims asset
      None -> seller_pkh
    }
  pays_value(recipient_pkh, asset_value, outputs)
}

fn find_validating_input(ctx: ScriptContext) -> Input {
  expect Spend(target_output_ref) = ctx.purpose
  expect Some(input) = find_input(ctx.transaction.inputs, target_output_ref)
  // Now return the input:
  input
}

fn get_continuing_outputs(ctx: ScriptContext) -> List<Output> {
  let input = find_validating_input(ctx)
  let script_address = input.output.address
  filter(
    ctx.transaction.outputs,
    fn(out: Output) { out.address == script_address },
  )
}

fn valid_cont_output(
  ctx: ScriptContext,
  target_value: Value,
  target_bid: Bid,
) -> Bool {
  expect [cont_output] = get_continuing_outputs(ctx)
  // check correct continuing output value
  if
  cont_output.value == merge(target_value, from_lovelace(target_bid.bid_amt)){
  
    // check correct continuing output datum
    expect InlineDatum(new_bid_state) = cont_output.datum
    expect Some(new_bid): Option<Bid> = new_bid_state
    new_bid.bidder_pkh == target_bid.bidder_pkh && new_bid.bid_amt == target_bid.bid_amt
  } else {
    False
  }
  // wrong value!
}

fn timelimit_not_reached(
  auction_state: AuctionDatum,
  ctx: ScriptContext,
) -> Bool {
  contains(ctx.transaction.validity_range, auction_state.end_time)
}
