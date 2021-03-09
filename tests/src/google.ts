import flagpole from "../../dist/index";

flagpole("Test Browser", (suite) => {
  suite.base("https://www.google.com");

  suite
    .scenario("Homepage Loads", "browser")
    .open("/")
    .next(async (context) => {
      await context.pause(2000);
    });
});
