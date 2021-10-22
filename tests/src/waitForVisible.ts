import flagpole from "../../dist/index";

const suite = flagpole("Basic Smoke Test of Site");

suite
  .scenario("Homepage Loads", "browser")
  .open("https://www.w3schools.com/bootstrap/bootstrap_carousel.asp")
  .next(async (context) => {
    const before = Date.now();
    await context.waitForVisible(".carousel-inner .item");
    const after = Date.now();
    const duration = after - before;
    context.assert(duration).between(1, 30000);
  });

suite
  .scenario("Wait for hidden", "browser")
  .open("https://getbootstrap.com/docs/4.0/components/collapse/")
  .next(async (context) => {
    const before = Date.now();
    await context.waitForHidden("#collapseExample");
    const after = Date.now();
    const duration = after - before;
    context.assert(duration).between(1, 30000);
  });
