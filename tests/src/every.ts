import flagpole, { JsonScenario } from "../../dist";

const expectedDuration = 1;
const arrayOfNumbers = [1, 1, 1];
const arrayOfObjects = [{ duration: 1 }, { duration: 1 }, { duration: 1 }];

flagpole(
  "Getting better expected vs actual data in the test report",
  async (suite) => {
    suite
      .scenario("Every number matches", JsonScenario)
      .mock(JSON.stringify(arrayOfNumbers))
      .next(async (context) => {
        const body = context.response.jsonBody.$;
        await context
          .assert("All durations match the expected duration", body)
          .every((num) => num === expectedDuration);
      });

    suite
      .scenario("Every object property matches", JsonScenario)
      .mock(JSON.stringify(arrayOfObjects))
      .next(async (context) => {
        const body = context.response.jsonBody.$;
        await context
          .assert("All objs' durations match the expected duration", body)
          .every((obj) => obj.duration === expectedDuration);
      });
  }
);
