import flagpole from "../../../dist/index";

const trackSchema = {
  type: ["object"],
  properties: {
    wrapperType: {
      type: ["string"],
    },
    kind: {
      type: ["string"],
    },
    artistId: {
      type: ["number"],
    },
    collectionId: {
      type: ["number"],
    },
    trackId: {
      type: ["number"],
    },
    artistName: {
      type: ["string"],
    },
    collectionName: {
      type: ["string"],
    },
    trackName: {
      type: ["string"],
    },
    collectionCensoredName: {
      type: ["string"],
    },
    trackCensoredName: {
      type: ["string"],
    },
    collectionArtistId: {
      type: ["number"],
    },
    artistViewUrl: {
      type: ["string"],
    },
    collectionViewUrl: {
      type: ["string"],
    },
    trackViewUrl: {
      type: ["string"],
    },
    previewUrl: {
      type: ["string"],
    },
    artworkUrl30: {
      type: ["string"],
    },
    artworkUrl60: {
      type: ["string"],
    },
    artworkUrl100: {
      type: ["string"],
    },
    collectionPrice: {
      type: ["number"],
    },
    trackPrice: {
      type: ["number"],
    },
    releaseDate: {
      type: ["string"],
    },
    collectionExplicitness: {
      type: ["string"],
    },
    trackExplicitness: {
      type: ["string"],
    },
    discCount: {
      type: ["number"],
    },
    discNumber: {
      type: ["number"],
    },
    trackCount: {
      type: ["number"],
    },
    trackNumber: {
      type: ["number"],
    },
    trackTimeMillis: {
      type: ["number"],
    },
    country: {
      type: ["string"],
    },
    currency: {
      type: ["string"],
    },
    primaryGenreName: {
      type: ["string"],
    },
    contentAdvisoryRating: {
      type: ["string"],
    },
  },
};

const itunesApiSchema = {
  type: ["object"],
  properties: {
    resultCount: {
      type: ["number"],
    },
    results: {
      type: ["array"],
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
