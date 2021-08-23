import flagpole from "../../dist/index";

flagpole("Test Templates", async (suite) => {
  const get = suite.template({
    type: "html",
    method: "get",
    statusCode: 200,
  });

  get("Landing page", { url: "https://www.google.com/" });
  get("Search results page", { url: "https://www.google.com/search?q=test" });
});
