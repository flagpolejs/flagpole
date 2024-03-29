import flagpole from "../../dist/index";

const suite = flagpole("Lifecycle").finally(async () => {
  // console.log("my suite started");
  await new Promise((resolve) => setTimeout(() => resolve(), 100));
  // console.log("my suite finally finished");
});

suite
  .scenario("Homepage Loads", "browser")
  .open("https://www.npmjs.com")
  .next(async (context) => {
    await context.waitForExists("div");
  })
  .finally(async () => {
    await new Promise((resolve, _) => setTimeout(() => resolve(), 100));
    // console.log("scenario finally");
  });
