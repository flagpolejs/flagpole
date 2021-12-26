import flagpole from "../../dist";

const suite = flagpole("No .next will dangle");

suite.maxSuiteDuration = 3000;

suite.scenario("Homepage Loads", "html").open("https://dribbble.com/");
