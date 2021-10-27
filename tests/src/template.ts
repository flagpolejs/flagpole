import flagpole from "../../dist/index";

flagpole("Test Templates", async (suite) => {
  const get = suite.template({
    type: "html",
    method: "get",
    statusCode: 200,
    set: [
      { alias: "email", value: "email@email.com" },
      { alias: "password", value: "password1!" },
    ],
    next: async (context) => {
      context.comment(context.get("email"));
      context.comment(context.get("password"));
    },
  });

  get("Google Landing page", { url: "https://www.google.com/" }).next(
    async (context) => {
      context.assert(context.get("email")).equals("email@email.com");
      context.assert(context.get("password")).equals("password1!");
    }
  );
  get("Search results page", {
    url: "https://www.google.com/search?q=test",
    set: [
      { alias: "email", value: "newEmail@email.com" },
      { alias: "password", value: "password2!" },
    ],
  }).next(async (context) => {
    context.assert(context.get("email")).equals("newEmail@email.com");
    context.assert(context.get("password")).equals("password2!");
  });
  get("Github Landing Page", {
    url: "https://github.com/",
    set: { alias: "password", value: "password3!" },
  }).next(async (context) => {
    context.assert(context.get("password")).equals("password3!");
  });
});
