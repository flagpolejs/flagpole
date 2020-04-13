import { Flagpole } from "../../dist/index.js";

const suite = Flagpole.Suite("Basic Cookie Test of Site")
  .base("https://fl.milesplit.com/")
  .finally(() => {
    suite.print();
  });

suite
  .html("Something simple", {
    cookies: {
      test: "foo",
    },
  })
  .open("/rankings", {
    headers: {
      foo: "bar",
    },
  })
  .next(async (context) => {
    const allLinks = await context.findAll("a");
    context.assert(allLinks.length).greaterThan(0);
  });
