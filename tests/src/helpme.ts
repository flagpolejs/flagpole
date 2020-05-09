import flagpole from "../../dist/index";

const suite = flagpole("help").base("https://www.milesplit.com");

suite
  .scenario("Homepage Loads", "html")
  .open("/")
  .next(async (context) => {
    context.comment("hello");
    context.exists("article");
  });
