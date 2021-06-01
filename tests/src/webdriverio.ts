import flagpole from "../../dist/index";

const suite = flagpole("Basic test of webdriverio");

suite
  .scenario("Homepage Loads", "html")
  .open("https://www.google.com/")
  .next(async (context) => {});
