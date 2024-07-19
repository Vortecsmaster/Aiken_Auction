

export type Result<T> =
  | { type: "ok"; data: T }
  | { type: "error"; error: Error };


// export interface MD_Tos {
//       [policyId: string]: {
//         [assetName: string]: {
//           id?: number;
//           name?: string;
//           image?: string;
//           description?: string;
//           hash?: string;
//           nom?: string;
//           apes?: string;current_bid
//         };
//       };
//     };
  
export interface contractJSON {
      "type": string;
      "description": string;
      "cborHex": string;
  }

