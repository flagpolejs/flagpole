import { Flagpole } from "../../dist/index.js";

const suite = Flagpole.Suite("Basic Cookie Test of Site")
  .finally(() => {
    suite.print();
  });

suite
  .html("Something simple")
  .open("/")
  .next(async context => {
    const allLinks = await context.findAll("a");
    context.assert(allLinks.length).greaterThan(0);
  });
