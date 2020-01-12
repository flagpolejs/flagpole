import { Flagpole } from "../../dist/index";

const suite = Flagpole.suite("Basic Smoke Test of Site");
const baseDomain = "https://www.google.com";

suite
  .base(baseDomain)
  .html("Homepage Loads")
  .open("/")
  .next("Logo", async context => {
    const logo = await context.exists("#hplogo");
    context
      .assert("Logo should look like the control.", await logo.downloadBinary())
      .looksLike("./tests/src/images/google.png");
  });
