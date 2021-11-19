import flagpole from "../../dist/index";
import { HttpResponseOptions } from "../../dist/interfaces";

flagpole("Test Assertion Schema", async (suite) => {
  const jtdSchema: any = {
    properties: {
      foo: { type: "string" },
    },
  };
  const jsonSchema: any = {
    type: "object",
    properties: {
      foo: { type: "string" },
    },
    required: ["foo"],
  };

  const validResponse: HttpResponseOptions = {
    status: [200, "OK"],
    body: {
      foo: "bar",
    },
  };

  const invalidResponse: HttpResponseOptions = {
    status: [200, "OK"],
    body: {
      foo: 123,
    },
  };

  const userResponse: HttpResponseOptions = {
    status: [200, "OK"],
    body: {
      user: {
        first_name: "Jason",
        last_name: "Byrne",
        level: 100,
      },
    },
  };

  const nullUserResponse: HttpResponseOptions = {
    status: [200, "OK"],
    body: {
      user: {
        first_name: "Ima",
        last_name: null,
        level: null,
      },
    },
  };

  suite
    .scenario("Matching Schema - File JsonSchema", "json")
    .mock(validResponse)
    .next((context) => {
      context.assert(context.response.jsonBody).schema("@foobar");
    });

  // borked
  // suite
  //   .scenario("Matching Schema - File JTD", "json")
  //   .mock(validResponse)
  //   .next((context) => {
  //     context.assert(context.response.jsonBody).schema("@foobar.jtd", "JTD");
  //   });

  suite
    .scenario("Matching Schema - Manual Schema JsonSchema", "json")
    .mock(validResponse)
    .next((context) => {
      context
        .assert(context.response.jsonBody)
        .schema(jsonSchema, "JsonSchema");
    });

  suite
    .scenario("Not matching schema, JsonSchema", "json")
    .mock(invalidResponse)
    .next((context) => {
      context
        .assert(context.response.jsonBody)
        .optional.schema("@foobar", "JsonSchema");
    });

  suite
    .scenario("Matching Schema - Manual Schema JTD", "json")
    .mock(validResponse)
    .next((context) => {
      context.assert(context.response.jsonBody).schema(jtdSchema, "JTD");
    });

  suite
    .scenario("Not matching schema, JTD", "json")
    .mock(invalidResponse)
    .next((context) => {
      context
        .assert(context.response.jsonBody)
        .optional.schema(jtdSchema, "JTD");
    });

  suite
    .scenario("Homepage Loads", "json")
    .open("https://pokeapi.co/api/v2/pokemon/ditto")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
      const json = context.response.jsonBody;
      context.comment(json);
      await context.assert(json).schema("@ditto");
    });

  suite
    .scenario("Matching User Schema - String or Null Property - String", "json")
    .mock(userResponse)
    .next((context) => {
      context.assert(context.response.jsonBody).schema("@user");
    });

  // this fails one property at a time
  // we want to get all properties in the first failure
  // issue #176
  // suite
  //   .scenario(
  //     "Matching Null User Schema - String or Null Property - Null",
  //     "json"
  //   )
  //   .mock(nullUserResponse)
  //   .next((context) => {
  //     context.assert(context.response.jsonBody).schema("@user");
  //   });
});
