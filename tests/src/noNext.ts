import flagpole, { HtmlScenario } from "../../dist";

const suite = flagpole("No .next will dangle");

suite.maxSuiteDuration = 3000;

suite.scenario("Homepage Loads", HtmlScenario).open("https://dribbble.com/");
