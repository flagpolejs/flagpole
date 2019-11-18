const Flagpole = require("../../dist/index.js").Flagpole;

const suite = Flagpole.Suite("Test Google Search")
  .base("https://fl.milesplit.com/")
  .finally(() => {
    suite.print();
  });

suite
  .Html("MileSplit Florida - Browser Test")
  .open("/")
  .then(async context => {
    context
      .assert(context.response.statusCode)
      .equals(200)
      .assert("Jason")
      .is("string")
      .assert(context.exists("section.videos"))
      .resolves();
  });
