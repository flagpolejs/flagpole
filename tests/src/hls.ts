import flagpole from "../../dist/index";
const masterManifestUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

flagpole("HLS Testing Demo", async (suite) => {
  suite
    .scenario("Test Big Buck Bunny", "hls")
    .open(masterManifestUrl)
    .next(async (context) => {
      await context.find("type").equals("master");
      const variants = await context.exists("variants");
      context.assert(variants).length.equals(5);
      const resolutionLadder = [
        "1280x720",
        "320x184",
        "512x288",
        "848x480",
        "1920x1080",
      ];
      resolutionLadder.forEach((resolution, i) => {
        variants
          .nth(i)
          .find("streamInf.resolution")
          .rename(`Resolution of Variant ${i + 1}`)
          .equals(resolution);
      });
      const variantUris = await context.find("variants[*].uri");
      variantUris.each((uri, i) => {
        variantTemplate(`Validate Variant ${i + 1}`, {
          url: new URL(uri, masterManifestUrl).toString(),
        });
      });
    });

  const variantTemplate = suite.template({
    type: "hls",
    next: {
      "Should be a VOD with more than one segment": async (context) => {
        await context.find("type").equals("vod");
        const segments = await context.find("segments");
        context.assert("There are ts segments", segments).length.greaterThan(1);
        context
          .assert("Every Segment URI ends with .ts", segments)
          .every((segment) => String(segment.uri).endsWith(".ts"));
      },
      "Has target duration with segments that match": async (context) => {
        const targetDuration = await context.find("targetduration");
        context.assert(targetDuration).between(2, 15);
        const segmentDurations = await context.find("segments[*].inf.duration");
        context
          .assert(
            "All segment durations are less or equal to target duration",
            segmentDurations
          )
          .every((duration) => {
            return duration <= targetDuration.$;
          });
      },
    },
  });
});
