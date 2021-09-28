import flagpole from "../../dist/index";

const suite = flagpole("Equals");

suite
  .json("With undefined and assertion titles")
  .open("https://reqres.in/api/users?page=1")
  .next((context) => {
    context.assert("OK").equals("OK");
    context.assert({ foo: "bar" }).equals({ foo: "bar" });
    context.assert([0, 1, 2]).equals([0, 1, 2]);
  });
