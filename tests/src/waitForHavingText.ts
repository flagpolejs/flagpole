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
      "Search algorithms",
      2000
    );
    context
      .assert(await searchAlgorithms.getInnerText())
      .equals("Search algorithms");
  });
