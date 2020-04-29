import flagpole from "../../dist/index";

const suite = flagpole("Test creating an api snapshot").base(
  "https://www.milesplit.com"
);

suite
  .scenario("Meet List API", "json")
  .open("/api/v1/meets")
  .next(async (context) => {
    await context.assert(context.response.jsonBody).schema("@meetsList");
  });

suite
  .scenario("Test meet page", "json")
  .open("/api/v1/meets/5322")
  .next(async (context) => {
    await context.assert(context.response.jsonBody).schema("@meet");
  });
