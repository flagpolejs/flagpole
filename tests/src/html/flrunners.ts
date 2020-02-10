const Flagpole = require("../../../dist/index.js").Flagpole;

const suite = Flagpole.Suite("Test Google Search")
  .base("https://fl.milesplit.com/")
  .finally(() => {
    suite.print();
  });

suite
  .html("MileSplit Florida - Front Page Test")
  .open("/")
  .next(async context => {
    const topStories = await context.exists(".topStories");
    const articles = await context.findAll(".topStories article");
    context.assert(articles).length.greaterThan(0);
  });

suite
  .html("Florida Runners Rankings Leaderboard")
  .open("/rankings")
  .next(async context => {
    context.comment(context.response.url);
    context.comment(context.response.finalUrl);
    await context.exists("#rankingsTable");
    const eventLink = await context.exists("#rankingsTable td.event > a");
    eventLink.click(eventRankings);
  });

const eventRankings = suite
  .html("Florida Runners Event Rankings")
  .next(async context => {
    context.comment(context.response.url);
    context.comment(context.response.finalUrl);
    context.comment(`There were ${context.response.redirectCount} redirects`);
    context.assert(context.response.finalUrl).contains("/pro/");
  });
