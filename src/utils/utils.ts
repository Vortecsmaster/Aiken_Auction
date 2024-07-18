import {
    applyParamsToScript,
    applyDoubleCborEncoding,
    SpendingValidator,
  } from "https://deno.land/x/lucid@0.10.7/mod.ts";


export function parametrizer(validatorScript: any, params: any[]): any 
    {
        return applyDoubleCborEncoding(applyParamsToScript(validatorScript, params))
    }; 


export async function readValidator(blueprintUri: string, index: number): Promise<SpendingValidator> {
      const validator = JSON.parse(await Deno.readTextFile(blueprintUri)).validators[index];
      console.log(validator.hash);
      return {
        type: "PlutusV2",
        script: validator.compiledCode, 
      };
  }

export async function readNoParamsValidator(blueprintUri: string, index: number): Promise<SpendingValidator> {
    const validator = JSON.parse(await Deno.readTextFile(blueprintUri)).validators[index];
    console.log(validator.hash);
    return {
      type: "PlutusV2",
      script: applyDoubleCborEncoding(validator.compiledCode), 
    };
}

  