import { Flagpole } from "../../dist/index";

const suite = Flagpole.suite("Basic Smoke Test of Site").base(
  "https://www.milesplit.com/"
);

suite
  .html("Homepage Loads")
  .open("/")
  .next(async context => {
    const a = await context.findHavingText("a", "Videos");
    context.comment(a);
    context.assert(await a.getInnerText()).equals("Videos");
  });

suite
  .html("Homepage Loads")
  .open("/calendar")
  .next(async context => {
    const a = await context.findAllHavingText("td", "New York, NY");
    context.comment(a.length.toString());
    context.assert(a.length).greaterThan(0);
  });
