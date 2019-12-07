const Flagpole = require("../dist/index.js").Flagpole;

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
    context.comment(await title.getInnerText());
    context.set("articles", articles);
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
    context.comment(await title.getInnerText());
    context.comment(await title.getTagName());
  });
