import flagpole from "../../dist/index";

const suite = flagpole("Wait for having text");

suite
  .scenario("Go to Google", "browser")
  .open("https://www.google.com/")
  .next(async (context) => {
    const howSearchWorks = await context.waitForHavingText(
      "a",
      "How Search works",
      2000
    );
    await howSearchWorks.click();
    await context.waitForNavigation();
  })
  .next(async (context) => {
    const searchAlgorithms = await context.waitForHavingText(
      "span",
      /Search algorithms/g,
      2000
    );
    context
      .assert(await searchAlgorithms.getInnerText())
      .equals("Search algorithms");

    // this fails
    const nullValue = await context.waitForHavingText(
      "span",
      "Search algorithmsssss",
      2000
    );
    context.assert(nullValue).equals(null);
    // but does not error

    context.assert(true).equals(true);
  });
