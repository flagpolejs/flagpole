import flagpole, { FlagpoleExecution } from "../../dist/index";

const suite = flagpole("Test creating an api snapshot").base(
  "https://www.milesplit.com"
);

suite
  .scenario("Meet List API", "json")
  .open("/api/v1/meets")
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
    await context.assert(context.response.jsonBody).schema("@meetsList", true);
    context.comment(context.response.jsonBody.$.data[0]);
    context.assert(context.response.jsonBody.$.data).matches([
      {
        id: "388250",
        name: "Ron Helmer Invitational",
        dateStart: "2020-09-23",
        dateEnd: "2020-09-23",
        season: "CC",
        seasonYear: "2020",
        venueCity: "Bristol",
        venueState: "VA",
        venueCountry: "USA",
      },
    ]);
    context
      .assert({
        foo: {
          bar: {
            isTrue: true,
          },
        },
      })
      .equals({
        foo: {
          bar: {
            isTrue: true,
          },
        },
      });
  });

suite
  .scenario("Test meet page", "json")
  .open("/api/v1/meets/5322")
  .next(async (context) => {
    await context.assert(context.response.jsonBody).schema("@meet");
    const data = await context.find("data");
    data.is.object();
    data.keys.assert().contains(["name", "id"]);
    data.assert().contains(["name", "id"]);
    data.item("name").is.string();
    data.item("dateStart").is.date();
    await data.exists("name");
    context.comment(data.$);
    console.log(await data.find("name"));
  });
