import { Flagpole } from "../../dist/index.js";

const suite = Flagpole.suite("setCookie method").base(
  "https://www.heroku.com/"
);

suite
  .browser("Homepage Loads")
  .before(async (context) => {
    await context.setCookie("foo", "bar");
  })
  .open("/")
  .next(async (context) => {
    context.assert(context.response.cookie("foo").toString()).equals("bar");
  });
