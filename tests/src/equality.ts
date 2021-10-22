import flagpole from "../../dist/index";

const suite = flagpole("Equals");

suite
  .resource("Test string, object, and array equality")
  .mock()
  .next((context) => {
    context.assert("OK").equals("OK");
    context.assert({ foo: "bar" }).equals({ foo: "bar" });
    context.assert([0, 1, 2]).equals([0, 1, 2]);
  });
