import { fp, iValue } from "../../dist/index";

fp.suite("Just random tests", suite => {
  suite.base("https://fl.milesplit.com/");
  const homepage = suite
    .html("Homepage Loads")
    .open("/athletes/6")
    .next(async context => {
      const blurry = await context.find(".blurry");
      context.assert(blurry).exists();
      context.assert(context.response.finalUrl).contains("/pro");
      const navLinks = await context.findAll("a.nav-link");
      context.assert(navLinks).length.greaterThan(0);
      context
        .assert("Nav links have text", navLinks)
        .every(async (link: iValue) => {
          const text = (await link.getInnerText()).toString();
          return text.length > 0;
        });
      context.assert("All tags are <a>", navLinks).every((link: iValue) => {
        return link.tagName == "a";
      });
    });
});
