import flagpole, { FlagpoleExecution } from "../../dist/index";

const suite = flagpole("Test creating an api snapshot").base(
  "https://www.milesplit.com"
);

suite
  .scenario("Meet List API", "json")
  .open("/api/v1/meets")
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
    await context.assert(context.response.jsonBody).schema("@meetsList");
    context.comment({
      name: "Jason",
      say: "Hello",
    });
  });

suite
  .scenario("Test meet page", "json")
  .open("/api/v1/meets/5322")
  .next(async (context) => {
    await context.assert(context.response.jsonBody).schema("@meet");
  });

suite
  .browser("Click on element that doesn't exist")
  .open("https://stackoverflow.com/")
  .next(async (context) => {
    await context.click("a.login-linc");
    const el = await context.find("a.login-linc");
    await el.click();
  });
