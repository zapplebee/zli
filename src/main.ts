import { z } from "zod";
import yargsParser from "yargs-parser";
import { stringFlag, boolFlag, numberFlag } from "./lib";
const yargv = yargsParser(process.argv.slice(2));

const d = z
  .object({
    foo: stringFlag({
      envars: ["FOO"],
      default: "fffff",
      description: "aaaaaaaaaa",
    }),
    bar: boolFlag({
      envars: ["FOO"],
      default: true,
      description: "aaaaaaaaaa",
    }),
    baz: numberFlag({
      envars: ["BAZ"],
      description: "aaaaaaaaaa",
    }),
  })
  .parse(yargv);

console.log(d);
