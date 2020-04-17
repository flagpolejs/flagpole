import { Flagpole, iScenario } from "../../dist/index.js";

const suite = Flagpole.suite("Basic Smoke Test of Site").base(
  "http://jsonprettyprint.net/"
);
suite
  .html("Submit JSON Pretty Print")
  .open("POST /json-pretty-print")
  .setFormData({ json_string: `{ "foo": "dsaf" }` })
  .next(async (context) => {
    const body = await context.exists("body");
    const pre = await body.exists("pre");
    context.comment((await pre.getInnerHtml()).$);
  });
