import { Flagpole } from "../../dist/index";

const suite = Flagpole.suite("Test creating an api snapshot").base(
  "https://www.milesplit.com"
);

suite
  .json("Snapshot created")
  .open("/api/v1/meets")
  .next(async (context) => {
    await context.assert(context.response.jsonBody).schema("meetsList");
  });
