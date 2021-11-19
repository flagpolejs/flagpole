import flagpole from "../../dist";

flagpole("Basic Smoke Test of Site", async (suite) => {
  suite
    .html("Homepage Loads")
    .open("https://appium.io/docs/en/drivers/ios-xcuitest/")
    .next(async (context) => {
      const textViews = await context.findAll("foobar");
      context.comment(textViews.length);
      context.assert("textViews exists", textViews.length).greaterThan(0);
    });
});
