import flagpole from "../../dist/index";

flagpole("Test Waits", (suite) => {
  suite.base("https://orlando.craigslist.org/");

  const homepage = suite
    .scenario("Homepage Loads", "html")
    .open("/")
    .next(async (context) => {
      const communityLink = await context.exists("div.community h3 a");
      const url = await communityLink.getUrl();
      community.open(url.toString());
    });

  const community = suite
    .scenario("Community Category Loads", "html")
    .next(async (context) => {
      const results = await context.findAll("#sortable-results ul.rows li");
      context.assert(results).length.greaterThan(0);
    });
});
