import flagpole from "../../../dist/index";

const suite = flagpole("Test Google Search").base("https://www.google.com/");

const browserOpts = {
  headless: false,
  recordConsole: true,
  outputConsole: false,
  width: 1024,
  height: 768,
};

const searchTerm = "Flagpole QA Testing Framework";
const paths = {
  queryInput: 'input[name="q"]',
  submitButton: 'input[value="Google Search"]',
  searchResultsItem: "#search div.g",
};

suite
  .scenario("Google Search for Flagpole", "browser", browserOpts)
  .open("/")
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
  })
  .next("Check Logo", async (context) => {
    const logo = await context.exists("img#hplogo");
    context.assert("Logo is visible", await logo.isVisible()).equals(true);
  })
  .next("Look for I'm feeling lucky button", async (context) => {
    const btn = await context.find("input", "lucky", {
      findBy: "value",
    });
    context.assert(btn).exists();
  })
  .next("Fill out form", async (context) => {
    //await context.page.type(paths.queryInput, searchTerm);
    const form = await context.find("form").exists();
    //await form.fillForm({
    //  q: searchTerm,
    //});
    const input = await context
      .find(paths.queryInput)
      .clearThenType(searchTerm);
    context
      .assert("Search term matches what we typed", await input.getValue())
      .equals(searchTerm);
    const button = await context.find(paths.submitButton);
    context.assert(button).exists();
    //await context.click(paths.submitButton);
    await form.submit();
    await context.waitForNavigation();
    const results = await context.find(paths.searchResultsItem);
    context.assert("Search results found", results).exists();
  });
