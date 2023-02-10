import { z } from "zod";
interface BaseFlag<T> {
  envars?: Array<string>;
  default?: T;
  description: string;
}

export function stringFlag(
  flag: BaseFlag<string>
): z.ZodEffects<z.ZodString, string, unknown> {
  return z.preprocess(
    (v) => {
      if (v !== undefined) {
        return v;
      }

      if (flag.envars) {
        for (const k in flag.envars) {
          if (process.env[k]) {
            return process.env[k];
          }
        }
      }
      if (flag.default) {
        return flag.default;
      }
    },
    z.string({
      description: flag.description,
      errorMap: (issue, ctx) => {
        console.log({ issue, ctx });
        return { message: ctx.defaultError };
      },
    })
  );
}

export function boolFlag(
  flag: BaseFlag<boolean>
): z.ZodEffects<z.ZodBoolean, boolean, unknown> {
  return z.preprocess(
    (v) => {
      if (v !== undefined) {
        return v;
      }

      if (flag.envars) {
        for (const k in flag.envars) {
          if (process.env[k]) {
            switch (process.env[k]) {
              case "FALSE":
              case "false":
              case "0":
                return false;
              case "TRUE":
              case "true":
              case "1":
                return true;
            }
          }
        }
      }
      if ("default" in flag) {
        return flag.default;
      }
    },
    z.boolean({
      description: flag.description,
      errorMap: (issue, ctx) => {
        console.log({ issue, ctx });
        return { message: ctx.defaultError };
      },
    })
  );
}

export function numberFlag(
  flag: BaseFlag<number>
): z.ZodEffects<z.ZodNumber, number, unknown> {
  return z.preprocess(
    (v) => {
      if (v !== undefined) {
        return v;
      }

      if (flag.envars) {
        for (const k of flag.envars) {
          console.log(k);
          if (process.env[k]) {
            const safeParseResult = z.coerce.number().safeParse(process.env[k]);
            if (safeParseResult.success) {
              return safeParseResult.data;
            } else {
              return process.env[k];
            }
          }
        }
      }
      if ("default" in flag) {
        return flag.default;
      }
    },
    z.number({
      description: flag.description,
      errorMap: (issue, ctx) => {
        return { message: ctx.defaultError };
      },
    })
  );
}
