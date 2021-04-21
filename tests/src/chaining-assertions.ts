import flagpole from "../../dist/index";

const suite = flagpole("Chaining Assertions");

suite
  .json("With undefined and assertion titles")
  .open("https://reqres.in/api/users?page=1")
  .next(async (context) => {
    context
      .assert(context.response.statusCode)
      .equals(200)
      .assert("Status is OK", context.response.statusMessage)
      .equals("OK")
      .assert(context.response["fooBar"])
      .equals(undefined)
      .assert("undefined equals undefined", context.response["fooBar"])
      .equals(undefined)
      .assert(undefined)
      .equals(undefined)
      .assert("undefined equals undefined", undefined)
      .equals(undefined);
  });
