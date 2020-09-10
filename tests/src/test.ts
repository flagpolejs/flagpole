import flagpole from "../../dist/index";

flagpole("Test Manual Response Object", async (suite) => {
  suite
    .scenario("Test Webhook", "resource")
    .webhook(8001)
    .next(async (context) => {});
});
