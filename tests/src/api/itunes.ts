import flagpole from "../../../dist/index";

const trackSchema = {
  properties: {
    wrapperType: {
      type: "string",
      enum: ["track"],
      matches: /track/i,
    },
    kind: {
      type: "string",
      test: function (value) {
        return value == "music-video";
      },
    },
    artistId: "number",
    trackId: "number",
    artistName: "string",
    trackName: "string",
    trackCensoredName: "string",
    artistViewUrl: "string",
    trackViewUrl: "string",
    previewUrl: "string",
    artworkUrl30: "string",
    artworkUrl60: "string",
    artworkUrl100: "string",
    trackPrice: "number",
    releaseDate: "string",
    trackExplicitness: "string",
    trackTimeMillis: "number",
    country: "string",
    currency: "string",
    primaryGenreName: "string",
    discCount: {
      type: "number",
      optional: true,
    },
    discNumber: {
      type: "number",
      optional: true,
    },
    trackCount: {
      type: "number",
      optional: true,
    },
    trackNumber: {
      type: "number",
      optional: true,
    },
    collectionId: {
      type: "number",
      optional: true,
    },
    collectionName: {
      type: "string",
      optional: true,
    },
    collectionCensoredName: {
      type: "string",
      optional: true,
    },
    collectionArtistId: {
      type: "number",
      optional: true,
    },
    collectionViewUrl: {
      type: "string",
      optional: true,
    },
    collectionPrice: {
      type: "number",
      optional: true,
    },
    collectionExplicitness: {
      type: "string",
      optional: true,
    },
  },
};

const itunesApiSchema = {
  properties: {
    resultCount: "number",
    results: {
      items: trackSchema,
    },
  },
};

const suite = flagpole("Test iTunes API").base("https://itunes.apple.com");

suite
  .scenario("Search for Tupac", "json")
  .open("/search?term=2pac&entity=musicVideo")
  .next("Check response code and headers", (context) => {
    context
      .assert("HTTP Status is 200", context.response.statusCode)
      .equals(200)
      .assert(context.response.header("Content-Type"))
      .contains("text/javascript")
      .assert("Response body is greater than 0", context.response.length)
      .greaterThan(0)
      .assert("Schema is valid", context.response.jsonBody)
      .schema(itunesApiSchema);
  })
  .next("Verify the data", async (context) => {
    const resultCount = await context.find("resultCount");
    const searchResults = await context.find("results");
    context
      .assert(searchResults)
      .type.equals("array")
      .assert(searchResults)
      .length.greaterThan(0)
      .assert(resultCount)
      .type.equals("number")
      .assert(resultCount)
      .greaterThan(0)
      .assert("Results Count field matches results length", resultCount)
      .equals(searchResults.length);

    await context
      .assert("Every result is a music video", searchResults)
      .every((result) => {
        return result["kind"] == "music-video";
      });

    await context.assert("No items are books", searchResults).none((result) => {
      return result["wrapperType"] == "book";
    });

    await context
      .assert("Some tracks are clean version", searchResults)
      .some((result) => {
        return result["trackExplicitness"] == "notExplicit";
      });
    return searchResults;
  })
  .next("Verify first track looks right", async (context) => {
    const searchResults = await context.result;
    const firstTrack = searchResults.$[0];
    context
      .assert("Track millimeters value is a number", firstTrack.trackTimeMillis)
      .type.equals("number")
      .assert(
        "Track number is between 1 and number of tracks",
        firstTrack.trackNumber
      )
      .between(1, firstTrack.trackCount);
  });
