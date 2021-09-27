import { Flagpole } from "../../dist/index";

const baseDomain = "https://www.google.com";
const suite = Flagpole.suite("Basic Smoke Test of Site").base(baseDomain);

suite
  .html("Cheerio test of Google Logo")
  .open("/")
  .next("Logo", async (context) => {
    const logo = await context.exists("#hplogo");
    context
      .assert("Logo should look like the control.", await logo.download())
      .looksLike("@google");
  });

suite
  .browser("Puppeteer test of Google screenshot", {
    headless: false,
  })
  .open("/")
  .next("Screenshot", async (context) => {
    await context.waitForExists("#hplogo");
    context
      .assert("Homepage matches control screenshot", await context.screenshot())
      .looksLike("@homepage");
  });
