import { Flagpole, iScenario } from "../../dist/index.js";

const suite = Flagpole.Suite("Basic Cookie Test of Site")
  .base("https://fl.milesplit.com/")
  .verifySslCert(false)
  .finally(() => {
    suite.print();
  });

suite
  .html("Something simple")
  .open("/rankings")
  .next(async (context) => {
    const allLinks = await context.findAll("a");
    context.assert(allLinks.length).greaterThan(0);
  });

suite
  .browser("Something simple")
  .open("/rankings")
  .next(async (context) => {
    const allLinks = await context.findAll("a");
    context.assert(allLinks.length).greaterThan(0);
  });
