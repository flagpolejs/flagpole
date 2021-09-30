import flagpole from "../../../dist/index";

const suite = flagpole("Test Google Search").base("https://www.google.com/");
// .finally((suite) => suite.print());

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
    const simple = await context.page?.evaluate(() => {
      return 1;
    });
    context.comment(simple);
    context.comment(typeof simple);
    context.assert(simple).equals(1);
    const images = await context.page?.evaluate(() => {
      return document.querySelectorAll("img").length;
    });
    context.comment(images);
    console.log(JSON.stringify(images));
    // toType() exists only on iValue I think
    // context.comment(context.toType(images));
    context.assert(Number(images)).greaterThan(0);
  });
