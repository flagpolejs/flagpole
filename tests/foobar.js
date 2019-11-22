const { Flagpole } = require("../dist/index.js");

const suite = Flagpole.suite("Do a test").base(suite => {
  return "https://www.google.com";
});

suite
  .html("Do something")
  .open("/")
  .next(async context => {
    context.assert(context.response.body.length).greaterThan(0);
    (await context.find("title")).as("pageTitle");
    context.set("foo", "bar");
  })
  .next("Next execution block", async context => {
    context.comment(context.get("pageTitle"));
    context.assert("foo equals bar", context.get("foo")).equals("bar");
  });
