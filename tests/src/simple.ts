import flagpole from "../../dist/index";

const suite = flagpole('Basic Smoke Test of Site');

suite
  .scenario("Test manual input", "resource")
  .mock("OK")
  .next((context) => {
    context.assert(context.response.body).equals("OK");
    context.assert(context.response.body).equals("NOT OK");
  });
