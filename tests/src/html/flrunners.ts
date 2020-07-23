import flagpole from "../../../dist/index";
import { iAssertionContext, iValue } from "../../../dist/interfaces";

const suite = flagpole("Test Google Search").base("https://fl.milesplit.com/");

const everyHasProperty = (
  context: iAssertionContext,
  items: iValue[],
  property: string
) =>
  context
    .assert(`Every item has ${property}`, items)
    .every(async (itemTag) => !(await itemTag.find(property)).isNull());

suite
  .html("MileSplit Florida - Front Page Test")
  .open("/")
  .next(async (context) => {
    const topStories = await context.exists(".topStories");
    const articles = await context.findAll(".topStories article");
    context.assert(articles).length.greaterThan(0);
    const athelteRankings = context.find("div.title", "athlete rankings");
    context.assert("Athlete rankings section exists", athelteRankings).exists();
    const image = await context.exists("img");
    image.open("Test Image Size", "image", async (context) => {
      const width = await context.find("width");
      context.assert(width).equals(620);
    });
  });

suite
  .html("Florida Runners Rankings Leaderboard")
  .open("/rankings")
  .next(async (context) => {
    context.comment(context.response.url);
    context.comment(context.response.finalUrl);
    await context.exists("#rankingsTable");
    const eventLink = await context.exists("#rankingsTable td.event > a");
    eventLink.open(eventRankings);
    //eventRankings.open(eventLink);
    //eventRankings.open((await eventLink.getAttribute("href")).$);
    context.comment((await context.find("title")).toString());
    await eventLink.click();
    context.comment("click");
    context.comment((await context.find("title")).toString());
  });

const eventRankings = suite
  .html("Florida Runners Event Rankings")
  .next(async (context) => {
    context.comment(context.response.url);
    context.comment(context.response.finalUrl);
    context.assert(context.response.finalUrl).contains("/pro/");
  });
