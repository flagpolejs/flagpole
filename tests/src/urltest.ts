import { Flagpole, HtmlScenario } from "../../dist/index.js";

const suite = Flagpole.Suite("Example test suite for blog post")
  .base({
    dev: "https://www.medium.com",
    stag: "https://www.medium.com",
    prod: "https://www.medium.com",
  })
  .finally((suite) => suite.print());

suite
  .scenario("Homepage Loads", HtmlScenario)
  .open("/")
  .next(async (context) => {
    // selectors are obfuscated, cannot guarantee articel in this example
    const subHeadings = await context.findAll("a");
    const randomStory =
      subHeadings[Math.floor(Math.random() * subHeadings.length)];
    randomStory.echo();
    context.assert(randomStory).exists();
    const url = await randomStory.getAttribute("href");
    context.comment(url.toString());
    articleScenario.open(url.toString());
  });

const articleScenario = suite
  .scenario("Test Article", HtmlScenario)
  .next(async (context) => {
    // assert that anything exists
    await context.exists("div");
  });
