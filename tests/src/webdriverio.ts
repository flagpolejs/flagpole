import flagpole from "../../dist/index";
const wdio = require("webdriverio");

const suite = flagpole("Basic test of webdriverio");

suite
  .scenario("Homepage Loads", "webdriverio")
  .open("https://www.google.com/")
  .next(async (context) => {
    const browser = await wdio.remote({
      capabilities: {
        browserName: "chrome",
      },
    });

    await browser.url("https://webdriver.io");

    const apiLink = await browser.$("=API");
    await apiLink.click();
    await browser.deleteSession();
  });
