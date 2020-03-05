import { iAssertionContext } from "../../../dist/interfaces";

const Flagpole = require("../../../dist/index.js").Flagpole;

const suite = Flagpole.suite("Set Basic Authentication for browser tests").base(
  "https://www.milesplit.info/"
);

suite
  .browser("Homepage Loads")
  .setBasicAuth({ username: "flocasts", password: "florocks!!!" })
  .open("/")
  .next(async (context: iAssertionContext) => {
    context.assert(context.response.statusCode).equals(200);
  });
