import flagpole from "../../dist/index";
import { browserOpts } from "./browser/browserOpts";

flagpole("Basic Smoke Test of Site", async (suite) => {
  suite
    .scenario("Homepage Loads", "browser")
    .open("https://flagpolejs.github.io/flagpole", browserOpts)
    .next(async (context) => {
      const currentUrl = context.currentUrl;
      context.assert(currentUrl).includes("/setup");
    });
});
