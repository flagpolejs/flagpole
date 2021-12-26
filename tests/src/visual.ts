import { Flagpole } from "../../dist/index";

const baseDomain = "https://www.debian.org";
const suite = Flagpole.suite("Basic Smoke Test of Site").base(baseDomain);

suite
  .scenario("Cheerio test of Debian Logo", "html")
  .open("/")
  .next("Logo", async (context) => {
    const logo = await context.exists("img[alt=Debian]");
    const download = await logo.download();
    //console.log(download);
    context
      .assert("Logo should look like the control.", download)
      .looksLike("@debian");
  });

suite
  .scenario("Puppeteer test of Debian screenshot", "browser", {
    headless: false,
  })
  .open("/")
  .next("Screenshot", async (context) => {
    await context.waitForExists("img[alt='Debian']");
    context
      .assert("Homepage matches control screenshot", await context.screenshot())
      .looksLike("@homepage", "11");
  });
