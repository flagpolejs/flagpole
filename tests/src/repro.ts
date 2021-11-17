import flagpole from "../../dist/index";

flagpole("Test timeout", async (suite) => {
  suite.maxScenarioDuration = 1000;

  await suite
    .scenario("NPM", "html")
    .open("GET https://www.npmjs.com")
    .next(async (context) => {
      await context.pause(2000);
    })
    .waitForFinished();
});
