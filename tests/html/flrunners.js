const Flagpole = require("../../dist/index.js").Flagpole;

const suite = Flagpole.Suite("Test Google Search")
  .base("https://fl.milesplit.com/")
  .finally(() => {
    suite.print();
  });

suite
  .html("MileSplit Florida - Browser Test")
  .open("/")
  .next(async context => {
    context.comment(context.response.url);
    context.comment(context.response.finalUrl);
    context
      .assert(context.response.statusCode)
      .equals(200)
      .assert("Jason")
      .type.equals("string");
  });

suite
  .html("Florida Runners Rankings")
  .open("/rankings")
  .next(async context => {
    context.comment(context.response.url);
    context.comment(context.response.finalUrl);
    await context.exists("#rankingsTable");
  });

suite
  .html("Florida Runners 5K Rankings")
  .open("GET /rankings/events/high-school-boys/cross-country/5000m?year=2019")
  .next(async context => {
    context.comment(context.response.url);
    context.comment(context.response.finalUrl);
    context.comment(`There were ${context.response.redirectCount} redirects`);
  });
