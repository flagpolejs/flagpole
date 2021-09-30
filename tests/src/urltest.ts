import { Flagpole } from "../../dist/index.js";

const suite = Flagpole.Suite("Example test suite for blog post")
  .base({
    dev: "https://www.medium.com",
    stag: "https://www.medium.com",
    prod: "https://www.medium.com",
  })
  .finally((suite) => suite.print());

suite
  .html("Homepage Loads")
  .open("/")
  .next(async (context) => {
    const subHeadings = await context.findAll("a");
    const randomStory =
      subHeadings[Math.floor(Math.random() * subHeadings.length)];
    randomStory.echo();
    context.assert(randomStory).exists();
    const url = await randomStory.getAttribute("href");
    context.comment(url.toString());
    articleScenario.open(url.toString());
  });

const articleScenario = suite.html("Test Article").next(async (context) => {
  context.assert(await context.find("h2")).exists();
});
