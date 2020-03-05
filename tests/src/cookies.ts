import { Flagpole } from "../../dist/index.js";

const suite = Flagpole.suite("setCookie method").base(
  "https://examples.sencha.com/"
);

suite
  .browser("Homepage Loads")
  .before(async context => {
    await context.setCookie("abc", "123");
  })
  .next(async context => {
    // @ts-ignore
    //  context.comment(JSON.stringify(context.page));
    context.comment(context.response.cookies);
  })
  .open("/");
