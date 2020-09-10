import flagpole from "../../dist/index";

flagpole("Test Manual Response Object", async (suite) => {
  suite
    .scenario("Set by opts", "json")
    .mock({
      body: {
        foo: "bar",
      },
      status: [200, "OK"],
    })
    .next(async (context) => {
      const foo = await context.exists("foo");
      context.assert(foo).equals("bar");
    });

  const server = await suite
    .scenario("Test Webhook", "json")
    .webhook()
    .next(async (context) => {})
    .server();
});
