import { assert } from "console";
import validator from "validator";
import flagpole, { FlagpoleExecution } from "../../dist/index";

const suite = flagpole("Test creating an api snapshot").base(
  "https://www.milesplit.com"
);

const exampleItemData = {
  id: "388250",
  name: "Ron Helmer Invitational",
  dateStart: "2020-09-23",
  dateEnd: "2020-09-23",
  season: "CC",
  seasonYear: "2020",
  venueCity: "Bristol",
  venueState: "VA",
  venueCountry: "USA",
};
const exampleListData = {
  data: [exampleItemData],
};

suite
  .scenario("Meet List API", "json")
  .open("/api/v1/meets")
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
    await context.assert(context.response.jsonBody).schema("@meetsList");
    context.comment(context.response.jsonBody.$.data[0]);
    context.assert(context.response.jsonBody).schema(exampleListData);
    await context.response.body.json
      .item("data")
      .assert("All rows are valid")
      .every((row) => context.assert(exampleItemData).schema(row));
    context.response.body.json
      .item("data")
      .count("registrationActive")
      .echo((str) => `${str} meets with registration`)
      .assert("At least one meet has registration")
      .greaterThan(0);
    context.response.body.json
      .item("data")
      .col("venueState")
      .unique()
      .desc()
      .echo();
    context.response.body.json.item("data").groupBy("venueState").keys.echo();
    context.response.body.json
      .item("data[0].name")
      .map((name: string) => name.toUpperCase())
      .echo();
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
    data
      .item("name")
      .map((name: string) => name.toUpperCase())
      .echo();
  });
