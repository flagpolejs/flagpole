import flagpole from "../../dist";

const suite = flagpole("Basic Smoke Test of Site");

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

suite.beforeAll(async () => {
  await sleep(999999);
});
suite
  .scenario("Homepage Loads", "browser")
  .open("https://linuxhint.com/configure-use-aliases-zsh/")
  .next(async (context) => {
    await context.waitForExists("div");
  });
