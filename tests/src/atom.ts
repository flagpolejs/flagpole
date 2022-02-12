import flagpole, { AtomScenario } from "../../dist/index";

flagpole("Basic Smoke Test of Site", async (suite) => {
  suite
    .scenario("Homepage Loads", AtomScenario)
    .open("https://api.flosports.tv/content/rss/articles.xml")
    .next({ statusCode: 200 });
});
