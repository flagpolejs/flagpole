const Flagpole = require("../dist/index.js").Flagpole;

const suite = Flagpole.Suite("Example test suite for blog post")
  .base({
    dev: "https://www.medium.com",
    stag: "https://www.medium.com",
    prod: "https://www.medium.com"
  })
  .finally(suite => suite.print());

suite
  .html("Homepage Loads")
  .open("/")
  .next(async context => {
    const topStory = await context.find(".extremeHero-postContent a");
    context.assert(topStory).exists();
    const url = await topStory.getAttribute("href");
    context.comment(url);
    articleScenario.open(url);
  });

const articleScenario = suite.html("Test Article").next(async context => {
  context.assert(await context.find("h1")).exists();
});
