import flagpole from "../../dist/index";
import { browserOpts } from "./browser/browserOpts";

const suite = flagpole("Basic Test of some, every, and none methods").base(
  "https://www.flagpolejs.com"
);

suite
  .scenario("Let's test these methods", "browser")
  .open("/", browserOpts)
  .next("Some", async (context) => {
    const navItems = await context.findAll("li.nav-item");

    // This should pass
    await context.assert(navItems).some(async (navItem) => {
      const navItemText = (await navItem.getInnerText()).toString().trim();
      return navItemText === "Features";
    });

    // This should fail
    await context.assert(navItems).not.some(async (navItem) => {
      const navItemText = (await navItem.getInnerText()).toString().trim();
      return navItemText === "Ooga booga";
    });
  })
  .next("Every", async (context) => {
    const navItems = await context.findAll("li.nav-item");

    // This should pass
    await context.assert(navItems).every(async (navItem) => {
      const navItemText = (await navItem.getInnerText()).toString().trim();
      return navItemText.length > 6;
    });

    // This should fail
    await context.assert(navItems).not.every(async (navItem) => {
      const navItemText = (await navItem.getInnerText()).toString().trim();
      return navItemText.length > 20;
    });
  })
  .next("None", async (context) => {
    const navItems = await context.findAll("li.nav-item");

    // This should pass
    await context.assert(navItems).none(async (navItem) => {
      const navItemText = (await navItem.getInnerText()).toString().trim();
      return navItemText.length > 20;
    });

    // This should fail
    await context.assert(navItems).not.none(async (navItem) => {
      const navItemText = (await navItem.getInnerText()).toString().trim();
      return navItemText.length > 6;
    });
  });
