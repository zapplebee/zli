import { StringFlag, Compile } from "./lib";

async function main() {
  const args = await Compile([
    StringFlag({
      name: "foo",
      alias: "f",
      envars: ["FOO"],
    }),
    StringFlag({
      name: "bar",
      alias: "b",
      envars: ["BAR"],
      validator: () => Promise.reject("aaa"),
    }),
  ]);

  console.log(args);
}

main();
