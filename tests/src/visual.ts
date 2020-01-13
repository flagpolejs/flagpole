import { Flagpole } from "../../dist/index";
import { RequestOptions } from "../../dist/interfaces";

const baseDomain = "https://www.google.com";
const suite = Flagpole.suite("Basic Smoke Test of Site").base(baseDomain);

suite
  .html("Cheerio test of Google Logo")
  .open("/")
  .next("Logo", async context => {
    const logo = await context.exists("#hplogo");
    context
      .assert("Logo should look like the control.", await logo.download())
      .looksLike("./tests/src/images/google.png");
  });

suite
  .browser("Puppeteer test of Google screenshot", {
    headless: false
  })
  .open("/")
  .next("Screenshot", async context => {
    const logo = await context.waitForExists("#hplogo");
    //await context.screenshot("google-screenshot.png");
    context
      .assert(await context.screenshot())
      .looksLike("./tests/src/images/google-screenshot.png");
  });
