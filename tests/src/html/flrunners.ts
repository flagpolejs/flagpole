import flagpole from "../../../dist/index";

const suite = flagpole("Test Google Search").base("https://fl.milesplit.com/");

suite
  .html("MileSplit Florida - Front Page Test")
  .open("/")
  .next(async (context) => {
    const topStories = await context.exists(".topStories");
    const articles = await context.findAll(".topStories article");
    context.assert(articles).length.greaterThan(0);
    const athelteRankings = context.find("div.title", "athlete rankings");
    context.assert("Athlete rankings section exists", athelteRankings).exists();
  });

suite
  .html("Florida Runners Rankings Leaderboard")
  .open("/rankings")
  .next(async (context) => {
    context.comment(context.response.url);
    context.comment(context.response.finalUrl);
    await context.exists("#rankingsTable");
    const eventLink = await context.exists("#rankingsTable td.event > a");
    await eventLink.click(eventRankings);
    //eventRankings.open((await eventLink.getAttribute("href")).$);
  });

const eventRankings = suite
  .html("Florida Runners Event Rankings")
  .next(async (context) => {
    context.comment(context.response.url);
    context.comment(context.response.finalUrl);
    context.assert(context.response.finalUrl).contains("/pro/");
  });
