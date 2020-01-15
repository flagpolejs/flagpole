import { fp, Suite } from "../../dist/index";

fp.suite("Test different wait methods", suite => {
  suite
    .base("https://orlando.craigslist.org/")
    .success(() => {
      console.log("Success");
    })
    .failure(() => {
      console.log("failure");
    })
    .afterEach(() => {
      console.log("After Each");
    })
    .afterAll(() => {
      console.log("After All");
    })
    .finally(() => {
      console.log("Suite Finally");
    });
  const homepage = suite
    .html("Homepage Loads")
    .open("/")
    .next(async context => {
      const communityLink = await context.exists("div.community h4 a");
      communityLink.click(community);
    });
  const community = suite
    .html("Community Category Loads")
    .waitFor(homepage)
    .next(async context => {
      const results = await context.findAll("#sortable-results ul.rows li");
      context.assert(results).length.greaterThan(0);
    });
});
