import { Flagpole } from "../../dist/index.js";
const nock = require("nock");
const fs = require("fs");

let mockRoutes = nock("http://test.flagpole");

mockRoutes.get("/test.html").reply(200, () => {
  return fs.createReadStream(__dirname + "/mock/test.html");
});

mockRoutes.get("/test2.html").reply(200, () => {
  return fs.createReadStream(__dirname + "/mock/test2.html");
});

let suite = Flagpole.Suite("Test")
  .base("http://test.flagpole")
  .finally(suite => suite.print());

suite
  .html("Test 1")
  .open("/test.html")
  .before("This is called before", () => {})
  .next(async context => {
    context
      .assert(context.response.statusCode)
      .equals(200)
      .assert(await context.findAll("a"))
      .length.greaterThan(0);
    (await context.findAll('a[href^="/"]')).forEach(link => {
      link.click();
    });
  });
