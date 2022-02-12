import flagpole, { HtmlScenario } from "../../dist";

const suite = flagpole("Scenario with no open method");

suite.maxSuiteDuration = 5000;

suite
  .scenario("Scenario should timeout", HtmlScenario)
  .open("https://dribbble.com/")
  .next((context) => {
    context.assert(context.response.statusCode).equals(200);
    throw "foo";
    scenarioB.open("https://www.dezeen.com/");
  });

const scenarioB = suite.scenario("Scenario B", HtmlScenario).next((context) => {
  context.assert(context.response.statusCode).equals(200);
});
