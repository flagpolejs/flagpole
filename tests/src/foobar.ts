import { Flagpole } from "../../dist/index.js";

const suite = Flagpole.Suite("Test")
  .base("https://fl.milesplit.com/")
  .finally(() => {
    suite.print();
  });

suite
  .html("MileSplit Florida - Front Page Test")
  .open("/")
  .next(async context => {
    const topStories = await context.exists(".topStories");
    const articles = await topStories.findAll("article");
    context
      .assert(articles)
      .length.greaterThan(0)
      .comment(`${articles.length} articles`);
    const title = await articles[0].find("a.title strong");
    context.comment((await title.getInnerText()).$).set("articles", articles);
  })
  .next("Second article", async context => {
    const title = await context.get("articles")[1].find("a.title strong");
    context.assert(await title.getInnerText()).length.greaterThan(0);
    context.comment(await title.getInnerText());
    context.assert(context.get("articles")).keys.includes(2);
  })
  .next("Last test", async context => {
    const topStories = await context.exists(".topStories");
    const title = await topStories.find("a.title strong");
    context.comment(String(await title.getInnerText()));
    context.comment(String(await title.getTagName()));
  });

const eventRankings = suite
  .html("MileSplit Florida - Front Page Test")
  .open(
    "/rankings/events/high-school-boys/indoor-track-and-field/{eventCode}?year=2019&accuracy=fat"
  )
  .next(async context => {
    await context.exists("div.blurry");
  });

setTimeout(() => {
  eventRankings.execute({
    eventCode: "55m"
  });
}, 1000);
