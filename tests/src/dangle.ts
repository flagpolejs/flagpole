import flagpole from "../../dist";

const suite = flagpole("Basic Smoke Test of Site");

suite.html("Homepage Loads").open("https://dribbble.com/");
//   .next({ statusCode: 200 });

// suite.json("No open method");
