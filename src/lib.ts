import yargsParser from "yargs-parser";

type ValidatorResult =
  | {
      valid: false;
      error: string;
    }
  | {
      valid: true;
    };

interface Validator<T> {
  (input: T): Promise<ValidatorResult>;
}

interface BaseFlag<T> {
  name: string;
  alias?: string;
  envars?: Array<string>;
  defaultValue?: T;
  validator?: Validator<T>;
}

interface FlagResult<T> {
  key: string;
  value: T;
}

interface FlagExecutor<T> {
  (yargv: Record<string, string>): Promise<FlagResult<T>>;
}

export function StringFlag(flagProps: BaseFlag<string>): FlagExecutor<string> {
  return async function StringFlagExecutor(yargv): Promise<FlagResult<string>> {
    let result: FlagResult<string> | null = null;
    if (yargv[flagProps.name]) {
      result = {
        key: flagProps.name,
        value: String(yargv[flagProps.name]),
      };
    }
    if (!result && flagProps.alias && yargv[flagProps.alias]) {
      result = {
        key: flagProps.name,
        value: String(yargv[flagProps.alias]),
      };
    }

    if (!result && flagProps.envars) {
      for (const k of flagProps.envars) {
        if (typeof process.env?.[k] === "string") {
          result = {
            key: flagProps.name,
            value: process.env[k] as string,
          };
        }
      }
    }

    if (result && flagProps.validator) {
      const validatorResult = await flagProps.validator(result.value);
      if (!validatorResult.valid) {
        throw new Error(validatorResult.error);
      }
    }

    if (!result && "defaultValue" in flagProps) {
      result = {
        key: flagProps.name,
        value: flagProps.defaultValue as string,
      };
    }

    if (result !== null) {
      return result;
    } else {
      throw new Error(`Could not assign ${flagProps.name}`);
    }
  };
}

// export function BoolFlag(flagProps: BaseFlag<boolean>): FlagExecutor<boolean> {
//   return async function BoolFlagExecutor(yargv): Promise<FlagResult<boolean>> {
//     let result: FlagResult<boolean> | null = null;

//     function setter(rawInput: string): void {
//       switch (rawInput) {
//         case "1":
//         case "true":
//         case "TRUE":
//           result = {
//             key: flagProps.name,
//             value: true,
//           };
//           break;
//         case "0":
//         case "false":
//         case "FALSE":
//           result = {
//             key: flagProps.name,
//             value: false,
//           };
//           break;
//       }
//     }

//     const yargvKey = flagProps.alias
//       ? flagProps.name ?? flagProps.alias
//       : flagProps.name;
//     if (yargv[yargvKey]) {
//       setter(yargv[yargvKey]);
//     }

//     if (!result && flagProps.envars) {
//       for (const k of flagProps.envars) {
//         if (typeof process.env?.[k] === "string") {
//           setter(process.env[k] as string);
//         }
//       }
//     }

//     if (result && flagProps.validator) {
//       const validatorResult = await flagProps.validator(
//         (result as FlagResult<boolean>).value
//       );
//       if (!validatorResult.valid) {
//         throw new Error(validatorResult.error);
//       }
//     }

//     if (!result && "defaultValue" in flagProps) {
//       result = {
//         key: flagProps.name,
//         value: flagProps.defaultValue as boolean,
//       };
//     }

//     if (result !== null) {
//       return result;
//     } else {
//       throw new Error(`Could not assign ${flagProps.name}`);
//     }
//   };
// }

export async function Compile(
  args: Array<FlagExecutor<string> | FlagExecutor<boolean>>
): Promise<Record<string, string | boolean>> {
  const yargv = yargsParser(process.argv.slice(2));
  const results = await Promise.allSettled(args.map((arg) => arg(yargv)));

  if (results.some((r) => r.status === "rejected")) {
    const overallError = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason)
      .join(", ");
    throw new Error(overallError);
  }

  return Object.fromEntries(
    results
      .map(
        (r) =>
          (
            r as PromiseFulfilledResult<
              FlagResult<string> | FlagResult<boolean>
            >
          ).value
      )
      .map(({ key, value }) => [key, value])
  );
}
