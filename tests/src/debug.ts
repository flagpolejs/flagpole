import { Flagpole, iScenario } from "../../dist/index.js";

const suite = Flagpole.suite("Basic Smoke Test of Site").base(
  "http://jsonprettyprint.net/"
);
suite
  .html("Homepage Loads")
  .open("POST /json-pretty-print")
  .before((scenario: iScenario) => {
    scenario.setFormData({ json_string: `{ "foo": "dsaf" }` });
  })
  .next(async (context) => {
    context.comment(context.response.body.$);
  });
