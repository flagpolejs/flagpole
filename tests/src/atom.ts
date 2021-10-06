import flagpole from "../../dist/index";

flagpole("Basic Smoke Test of Site", async (suite) => {
  suite
    .scenario("Homepage Loads", "atom")
    .open("https://api.flosports.tv/content/rss/articles.xml")
    .next({ statusCode: 200 });
});
