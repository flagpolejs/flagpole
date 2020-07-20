import flagpole from "../../../dist/index";
import { assert } from "console";

const suite = flagpole("Test Google Search").base("https://www.milesplit.com/");

const browserOpts = {
  headless: false,
  recordConsole: true,
  outputConsole: false,
  width: 1024,
  height: 768,
};

suite
  .browser("Rankings", browserOpts)
  .open("/rankings")
  .next("Default rankings page", async (context) => {
    await context.exists("#ddSeason");
    await context.selectOption("#ddSeason", "cross-country");
    return context.waitForNavigation();
  })
  .next("Change rankings to XC", async (context) => {
    const thRank = await context.find("th", "place");
    context.assert("Place column header exists", thRank).exists();
    await context.click("td.event a");
    return context.waitForNavigation();
  })
  .next("Individual event rankings and paywall", async (context) => {
    await context.exists("a.join");
    const joinNow = await context.find("a", "Join Now");
    context.assert("Join Now button exists", joinNow).exists();
  });
