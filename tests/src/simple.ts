import flagpole, { JsonScenario } from "../../dist/index";
import { isAsyncCallback } from "../../dist/util";

flagpole("Simple Mock Tests", (suite) => {
  suite
    .scenario("Array Stuff", JsonScenario)
    .mock(
      JSON.stringify({
        array1: [{ name: "Bo" }, { name: "Jackson" }],
      })
    )
    .next(async (context) => {
      const array1 = await context.find("array1");
      array1
        .pluck("name")
        .assert("Every name is a string")
        .every((name) => typeof name === "string");
      context
        .assert("Every name is a string", array1)
        .pluck("name")
        .every((name) => typeof name == "string");
      context.assert("some", array1).some((item) => !!item.name);
      context.assert("none", array1).none((item) => !item.name);
      array1.some((item) => !!item.name);
    });

  suite
    .scenario("Array of Values", JsonScenario)
    .mock({
      jsonBody: { data: [{ foo: "bar" }] },
    })
    .next(async (context) => {
      const data = await context.exists("data"); // pass
      data.length.$;
      context.assert(data).is.array(); // pass
      context.assert(data.$[0].foo).exists(); // pass
      data.first.exists("foo");
      data.last.exists("foo");
      data.assert("Every item has foo").every((item) => !!item["foo"]);
      data.nth(0).assert().hasProperty("foo");
    });

  suite
    .scenario("Test Async", JsonScenario)
    .mock({
      jsonBody: {},
    })
    .next(async (context) => {
      context.comment(isAsyncCallback(() => {}));
      context.comment(isAsyncCallback(function () {}));
      context.comment(isAsyncCallback(async () => {}));
      context.comment(isAsyncCallback(async function () {}));
    });
});
