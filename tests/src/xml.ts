import flagpole from "../../dist/index";

const suite = flagpole("Test XML");

suite
  .scenario("NASA RSS as XML", "xml")
  .open("https:////www.nasa.gov/rss/dyn/breaking_news.rss")
  .next(async (context) => {
    const titleText = await (
      await context.find("channel title")
    ).getInnerText();
    context
      .assert("Channel title has text", titleText)
      .trim.length.greaterThan(0);
    context.comment(titleText);
    const items = await context.findAll("item");
    context
      .assert("There are more than five items", items)
      .length.greaterThan(5);
  });

// suite
//   .scenario("Wasabi Status RSS Feed", "rss")
//   .open("https://status.wasabi.com/pages/5abbc12aeb57a904e44a58d3/rss")
//   .next(async (context) => {
//     const titleText = await (
//       await context.find("channel title")
//     ).getInnerText();
//     context
//       .assert("Channel title has text", titleText)
//       .trim.length.greaterThan(0);
//     context.comment(titleText);
//     const items = await context.findAll("item");
//     context.assert("There are ten items", items).length.equals(10);
//   });

// suite
//   .scenario("The Register's Atom Headlines", "atom")
//   .open("https://www.theregister.co.uk/headlines.atom");
