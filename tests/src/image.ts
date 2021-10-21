import flagpole from "../../dist";

const suite = flagpole("Basic Smoke Test of Site");

suite
  .scenario("Homepage Loads", "browser")
  .open(
    "https://www.johnkrausphotos.com/Galleries/Launches/Falcon-9-Inspiration4/"
  )
  .next("Get all images", async (context) => {
    const imgs = await context.findAll("img");
    context.assert(imgs).length.greaterThan(0);

    // test the first image
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      const imgSrc = await img.getAttribute("src");
      if (imgSrc.$.includes("http")) {
        return imgScenario(imgSrc.$);
      }
    }

    // test all images
    //  imgs.forEach(async (img) => {
    //    const imgSrc = (await img.getAttribute("src")).$;
    //    if (imgSrc.includes("http")) {
    //      imgScenario(imgSrc);
    //    }
    //  });
  });

const imgScenario = (imgPath: string) =>
  suite
    .scenario("Image test", "image")
    .open(imgPath)
    .next({ statusCode: 200 })
    .next(async (context) => {
      const width = await context.exists("width");
      const height = await context.exists("height");
      // context.assert("Has width", width).greaterThan(0);
      // context.assert("Has height", height).greaterThan(0);
    });
