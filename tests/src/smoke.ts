import { Flagpole } from "../../dist/index";

const suite = Flagpole.suite("Basic Smoke Test of Site").base(
  "https://www.milesplit.com/"
);

const scenario1 = suite
  .html("Homepage Loads")
  .open("/")
  .next(async (context) => {
    const a = await context.findHavingText("a", "Videos");
    context.comment(a);
    context.assert(await a.getInnerText()).like("Videos");

    const image = await context.exists("img");
    image.load(async (context) => {
      context.comment(context.response.body);
      const width = await context.find("width");
      context.assert(width).equals(620);
    });
  });

const scenario2 = suite
  .scenario("Click me", "browser")
  .open("https://stackoverflow.com/")
  .next(async (context) => {
    await context.waitForExists("a.login-link");
    await context.click("a.login-link");
  });
