import { Flagpole } from "../../dist/index.js";

let suite = Flagpole.Suite("Test MileSplit").base("https://www.milesplit.com");

suite
  .html("Test MileSplit Hompage")
  .open("/")
  .next("Load up homepage and verify response", function () {
    this.assert("HTTP Status is 200", this.response.statusCode).equals(200);
    this.assert(
      "Content type is HTML",
      this.response.header("content-type")
    ).contains("text/html");
  })
  .next("Look for images in top stories", async function () {
    const coverImages = await this.findAll("section.topStories figure img");
    this.assert(
      "There should be at least 4 top stories",
      coverImages.length
    ).greaterThanOrEquals(4);
    return coverImages;
  })
  .next("Verify images load", async function () {
    const coverImages = await this.result;
    this.assert("Every cover image has src attribute", coverImages).every(
      async function (image) {
        return await image.hasAttribute("src");
      }
    );
    coverImages.forEach(async function (image, i) {
      image.load(`Load Cover Image ${i + 1}`, async function () {
        this.assert("Width is 620", await this.find("width")).equals(620);
      });
    });
  })
  .next("Verify CSS", async function (context) {
    const css = await this.findAll('link[rel="stylesheet"]');
    css.forEach((stylesheet) => {
      stylesheet.load(async (context) => {
        const body = await this.find("body");
        if (!body.isNull()) {
          const background = await body.getProperty("background");
          context.comment(background.toString());
        }
      });
    });
  })
  .next("Click first meet and load it", async function () {
    const firstMeetCoverage = await this.find(".meetCoverage article a");
    //firstMeetCoverage.click('Load first meet', function (response) {
    //    this.comment('hi');
    //});
  });
