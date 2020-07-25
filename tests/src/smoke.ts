import flagpole, { iValue } from "../../dist/index";

const browserOpts = {
  headless: false,
  recordConsole: true,
  outputConsole: false,
  width: 1024,
  height: 768,
};

const suite = flagpole("Basic Smoke Test of Site").base(
  "https://www.milesplit.com/"
);

const scenario1 = suite
  .scenario("Homepage Loads", "browser")
  .open("/")
  .next(async (context) => {
    const images = await context.findAll("img");
    context.assert("All imgs have src", images).hasAttribute("src");
    const a = await context.exists("a", "Videos");
    context.comment(a);
    context.assert(await a.getInnerText()).like("Videos");
    const image = await context.exists("section.topStories img");
    image.open("Test Image Size", "image", async (context) => {
      const width = await context.find("width");
      context.assert(width).equals(620);
    });
  });
