import { Flagpole } from "../../dist/index";
import { RequestOptions } from "../../dist/interfaces";

const baseDomain = "https://www.google.com";
const suite = Flagpole.suite("Basic Smoke Test of Site").base(baseDomain);

suite
  .html("Cheerio test of Google Logo")
  .open("/")
  .next("Logo", async context => {
    const logo = await context.exists("#hplogo");
    // await logo.download("google.png");
    context
      .assert("Logo should look like the control.", await logo.download())
      .looksLike("./tests/images/google.png");
  });

suite
  .browser("Puppeteer test of Google screenshot", {
    headless: false
  })
  .open("/")
  .next("Screenshot", async context => {
    await context.waitForExists("#hplogo");
    const screenshot = await context.screenshot();
    context
      .assert("Compare using local file path", screenshot)
      .looksLike("./tests/images/google-screenshot.png");
    context.assert("Compare using the @", screenshot).looksLike("@homepage");
  });

suite
  .browser("Puppeteer test of Google Search Results screenshot", {
    headless: false
  })
  .open("/search?q=flagpole+qa")
  .next("Screenshot", async context => {
    await context.waitForExists("div.logo");
    context.assert(await context.screenshot()).looksLike("@search_results");
  });
