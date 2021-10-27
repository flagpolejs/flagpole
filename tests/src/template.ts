import flagpole from "../../dist/index";

flagpole("Test Templates", async (suite) => {
  const get = suite.template({
    type: "html",
    method: "get",
    statusCode: 200,
    set: { alias: "email", value: "email@email.com" },
    next: async (context) => {
      context.comment(context.get("email"));
    },
  });

  get("Landing page", { url: "https://www.google.com/" }).next(
    async (context) => {
      context.assert(context.get("email")).equals("email@email.com");
    }
  );
  get("Search results page", {
    url: "https://www.google.com/search?q=test",
    set: { alias: "email", value: "newEmail@email.com" },
  }).next(async (context) => {
    context.assert(context.get("email")).equals("newEmail@email.com");
  });
});
