import { Flagpole } from "../../dist/index.js";

const suite = Flagpole.Suite("Test NPM").base("https://www.npmjs.com");

suite
  .html("Load front page of NPM")
  .open("/")
  .next(async (context) => {
    const link = await context.find("a#nav-docs-link");
    context.assert(link).exists();
    context.assert(await link.getText()).equals("Documentation");
    context.assert(await link.getText()).like("Documentation");
    const search = await context.find("#search");
    context.assert(search).exists();
    context.assert(await search.getAttribute("method")).equals("GET");
    context.assert(await search.getAttribute("action")).equals("/search");
  });
