### TX 1 - Create Auction
Inputs:
  - Enough ADA to cover fees + bundled ADA
  - NFT to be auctioned

Outputs:
  -NFT + bundled ADA into the Auctioner_Val Address
    With Auction_Datum

Conditions:
  - There must be a datum that contains the right NFT pid+tn to be auctioned. 
x
### TX 2 - Cancel Autcion
Inputs:
  - Tx fees
  - NFT + bundled ADA from Auctioner_Val Address 

Outputs:
 - NFT + bundled ADA to Sellers Address

Conditions:
 - There must be NO bids.
 - The NFT goes back to seller.

### TX 3 - Place First Bid 
Inputs:
  - NFT + bundled ADA is consumed from script Address
  - New bid value + tx fees

Outputs:
  - NFT + bundled ADA goes back to script Address
  - Previous Bid value goes back to previous bidder

Conditions:
  - Datum must be updated with Value higher than minimun bid
  - Bid must be value in a UTxO


### TX 4 - Place Higher Bid
Inputs:
  - NFT+bundled ADA is consumed from script Address
  - New highest bidder value + tx fees

Outputs:
  - Datum must be updated with Value higher than current highest bid
  - Higher Bid must be value in a UTxO


Conditions:
  - Datum must be updated with Value higher than minimun bid
  - Higher Bid must be value in a UTxO


### TX 5 - Payouts
Inputs:
NFT + blunded ADA + Highest Bidder Value

Outputs:
NFT + blunded ADA to Highest Bidder Address
ADA value to Seller Address

Conditions:
Output with NFT MUST go to Highest bidder Address
ADA Value equal to highest bid must go to Seller Address