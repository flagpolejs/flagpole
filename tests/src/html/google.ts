import flagpole, { HtmlScenario } from "../../../dist/index";

flagpole("Test Google", (suite) => {
  suite.base("http://www.google.com");

  const homepage = suite
    .scenario("Homepage", HtmlScenario)
    .open("/")
    .next("Test basic HTTP headers", async (context) => {
      context.assert(context.response.statusCode).equals(200);
      context
        .assert(context.response.header("content-type"))
        .contains("text/html");
    })
    .next(async (context) => {
      const submitButton = await context.find('input[type="submit"]');
      context.comment(submitButton);
      context
        .assert(await submitButton.getAttribute("value"))
        .in(["Google Search", "Search"]);
    })
    .next(async (context) => {
      const form = await context.find("form");
      // Issue #137
      // context.assert("Should be a form", form).not.equals(null);
      context
        .assert(
          "Form action attribute should be /search",
          await form.getAttribute("action")
        )
        .equals("/search");
      await form.fillForm({
        q: "milesplit",
        foo: "bar",
      });
      const input = await context.find('input[name="q"]');
      context.assert(input).exists();
      const value = await input.getValue();
      context.assert(value).equals("milesplit");
      await form.submit();
      const searchInputBox = await context.find('input[name="q"]');
      context
        .assert(
          "Search input box should have the value we typed",
          await searchInputBox.getValue()
        )
        .equals("milesplit");
    });
});
