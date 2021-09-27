const Flagpole = require("../../dist/index.js").Flagpole;
const suite = Flagpole.suite("Basic Smoke Test of Site").base({
  stag: "http://staging-arena.flowrestling.org/",
  prod: "http://arena.flowrestling.org/",
});

const opts = {
  width: 1280,
  height: 600,
  headless: false,
};

const selectors = {
  sectionHeaders: ".section > div.events > h4",
};

suite
  .browser("Homepage Loads Stuff", opts)
  .open("/")
  .next(async (context) => {
    context
      .assert("HTTP Status equals 200", context.response.statusCode)
      .equals(200);
    await context.waitForExists(selectors.sectionHeaders, 10000);
    const section1 = await context.find(".current.section h4");
    if (section1.isNull()) {
      context.comment("No live events today. Skipping test.");
    } else {
      context.assert(await section1.getText()).contains("Live Today");
    }
    const section2 = await context.find(".upcoming.section h4");
    context.assert(await section2.getText()).contains("Upcoming");
    const section3 = await context.find(".results.section h4");
    context.assert(await section3.getText()).contains("Results");
  })
  .next(async (context) => {
    const listItems = await context.findAll(".upcoming .events-group li");
    const firstItem = listItems[0];
    context
      .assert("More that one list item in upcoming", listItems)
      .length.greaterThan(0);
    context.assert("Found first li", firstItem).exists();
    context.comment(await firstItem.getText());
    const secondItem = await firstItem.getNextSibling();
    context.comment(await secondItem.getText());
    context
      .assert(
        "Text of second item contains registration",
        await secondItem.getText()
      )
      .contains("Registration");
    const ul = await firstItem.getParent();
    context
      .assert("ul has class list", await ul.hasClassName("list"))
      .equals(true);
    context
      .assert("got next siblings", await firstItem.getNextSiblings())
      .length.greaterThan(0);
    context
      .assert("got siblings", await firstItem.getSiblings())
      .length.greaterThan(0);
    context
      .assert("no previous siblings", await firstItem.getPreviousSiblings())
      .length.equals(0);
    context.assert("found lis", await ul.findAll("li")).length.greaterThan(0);
    context
      .assert("find title, should fail", await ul.findAll("title"))
      .length.equals(0);
    const firstLink = await ul.find("a[href]");
    context.assert("link is valid", firstLink).not.equals(null);
    context
      .assert(" get children", await ul.getChildren("li"))
      .length.not.equals(0);
    context.comment("load it");
    await firstLink.click("Click first link", async (context) => {
      context.comment("hi");
    });
    context.comment("loaded it");
  });

suite
  .browser("Check Log in and log out", opts)
  .open("/")
  .next("Load Arena Homepage", async (context) => {
    const loginLink = await context.waitForExists("a.login", 10000);
    context.assert(await loginLink.getText()).like("Log in");
    //click on login link
    return loginLink.click();
  })
  .next("Load Login page", async (context) => {
    await context.waitForNavigation(20000);
    context.assert(await context.find("h1.funnel-title")).exists();
  });
