import flagpole, { JsonScenario } from "../../dist";

const mockBody = {
  foo: "bar",
};

flagpole("Basic Mock JSON Test", async (suite) => {
  suite
    .scenario("Homepage Loads", JsonScenario)
    .mock({
      jsonBody: mockBody,
    })
    .next(async (context) => {
      const foo = await context.exists("foo");
      context.assert(foo).equals("bar");
      context.assert(foo).type.equals("string");
    });
});
