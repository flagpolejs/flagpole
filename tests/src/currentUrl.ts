import flagpole from "../../dist/index";

flagpole("Basic Smoke Test of Site", async (suite) => {
  suite
    .scenario("Homepage Loads", "browser")
    .open("https://flagpolejs.github.io/flagpole")
    .next(async (context) => {
      const getStarted = await context.waitForHavingText("a", "Get Started");
      await getStarted.click();
      // wait for the scroll
      await context.waitForExists("body.sticky");
      const currentUrl = context.currentUrl;
      context.comment(currentUrl);
      context.assert(currentUrl).includes("what-is-flagpole");
    });
});
