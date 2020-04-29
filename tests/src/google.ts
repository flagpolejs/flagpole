import flagpole from "../../dist/index";

const suite = flagpole("Test browser").base("https://www.google.com");

suite
  .scenario("Homepage Loads", "browser")
  .open("/")
  .next(async (context) => {
    await context.pause(2000);
  });
