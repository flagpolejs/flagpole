import { Flagpole } from "../../dist/index.js";

const suite = Flagpole.suite("Basic Smoke Test of Site").base(
  "https://www.milesplit.com/"
);
suite
  .json("Homepage Loads")
  .open("/api/v1/videos")
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
    //console.log(context.response.body.$.data);
  });
