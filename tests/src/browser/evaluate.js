const Flagpole = require("../../dist/index.js").Flagpole;

const suite = Flagpole.Suite("Test Google Search")
  .base("https://www.google.com/")
  .finally((suite) => suite.print());

const browserOpts = {
  headless: false,
  recordConsole: true,
  outputConsole: false,
  width: 1024,
  height: 768,
};

suite
  .browser("Test evaluate method", browserOpts)
  .open("/")
  .next(async (context) => {
    const simple = await context.evaluate(() => {
      return 1;
    });
    context.comment(simple);
    context.comment(typeof simple);
    context.assert(simple).equals(1);
    const images = await context.evaluate(() => {
      return document.querySelectorAll("img").length;
    });
    context.comment(images);
    console.log(JSON.stringify(images));
    context.comment(Flagpole.toType(images));
    context.assert(images).length.greaterThan(0);
  });
