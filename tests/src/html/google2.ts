import flagpole from "../../../dist/index";
const searchTerm = "Flagpole JS";

flagpole("Basic Smoke Test of Site", async (suite) => {
  suite.base("https://www.google.com").finally((suite) => suite.print());

  suite
    .scenario("Homepage Loads", "html")
    .open("/")
    .next("Test the basic headers", (ctx) => {
      ctx.assert("Status is 200", ctx.response.statusCode).equals(200);
    })
    .next("Fill out the search form", async (ctx) => {
      const form = await ctx.find("form");
      const searchBox = await ctx.find('input[name="q"]');
      ctx.assert("Form exists on the page", form).exists();
      ctx.assert(searchBox).exists();
      await form.fillForm({
        q: searchTerm,
      });
      ctx.assert(await searchBox.getValue()).equals(searchTerm);
      const res = await form.submit();
      const resUrl = res.context.response.currentUrl.$ || "";
      resultsScenatio.open(resUrl);
    });

  const resultsScenatio = suite
    .scenario("Results Page Loads", "html")
    .next("Test the basic headers", (ctx) => {
      ctx.assert("Status is 200", ctx.response.statusCode).equals(200);
    })
    .next("Assert results", async (ctx) => {
      const result = await ctx.find(
        'a[href*="https://www.npmjs.com/package/flagpole"]'
      );
      ctx.assert(result).exists();
    });
});
