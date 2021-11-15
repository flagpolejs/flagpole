import flagpole from "../../dist/index";

flagpole("Basic Smoke Test of Site", async (suite) => {
  suite
    .scenario("Homepage Loads", "browser")
    .open("https://flagpolejs.github.io/flagpole")
    .next(async (context) => {
      const currentUrl = context.currentUrl;
      context.assert(currentUrl).includes("/setup");
    });
});
