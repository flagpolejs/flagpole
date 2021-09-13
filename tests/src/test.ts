import flagpole from "flagpole";

flagpole("Basic Smoke Test of Site", async (suite) => {
  suite
    .scenario("Homepage Loads", "json")
    .open("/")
    .next(async (context) => {});
});
