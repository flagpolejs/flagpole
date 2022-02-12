import flagpole, { HtmlScenario } from "../../dist/index.js";

const suite = flagpole("Basic Smoke Test of Site").base(
  "http://jsonprettyprint.net/"
);

suite
  .scenario("Submit JSON Pretty Print", HtmlScenario)
  .open("POST /json-pretty-print")
  .setFormData({ json_string: `{ "foo": "dsaf" }` })
  .next(async (context) => {
    const body = await context.exists("body");
    const pre = await body.exists("pre");
    context.comment((await pre.getInnerHtml()).$);
  });
