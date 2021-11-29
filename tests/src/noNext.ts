import flagpole from "../../dist";

const suite = flagpole("No .next will dangle");

suite.maxSuiteDuration = 3000;

suite.html("Homepage Loads").open("https://dribbble.com/");
