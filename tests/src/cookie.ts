import { Flagpole } from "../../dist/index.js";

const suite = Flagpole.Suite("Basic Cookie Test of Site")
  .base("https://www.milesplit.com")
  .finally(() => {
    suite.print();
  });

const test = suite
  .html("Not logged in test")
  .open("/")
  .next("Boo", (context) => {
    context
      .comment(context.response.finalUrl.$)
      .comment(context.response.cookies.$[0].key)
      .comment(context.response.cookie("unique_id").$);
    const value = context.response.cookie("unique_id").toString();
    context
      .assert(context.response.cookie("unique_id"))
      .exists()
      .assert(context.response.cookie("unique_id").toString())
      .equals(value);
  });
