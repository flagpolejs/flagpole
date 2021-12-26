import flagpole from "../../../dist/index";

const suite = flagpole("Uber Eats Sample Test").base(
  "https://www.ubereats.com/"
);

const paths = {
  addressInput: "#location-typeahead-home-input",
  selectAddressButton: "ul#location-typeahead-home-menu li",
  submitButton: 'form button[type="submit"]',
  orlandoRestaurantResults:
    "#main-content div div:nth-child(3) div:nth-child(2) a",
  restaurantHeader: "h1",
};

const address = "2180 W State Rd 434, Longwood, FL 32779";

suite
  .scenario("Start on homepage and find local restaurants", "browser", {
    headless: false,
  })
  .open("/")
  .next(
    "Go to front page, type in an address, and click search",
    async (context) => {
      const addressInput = await context.waitForVisible(
        paths.addressInput,
        15000
      );
      context.assert("Address input box is visible", addressInput).exists();
      await context.click(paths.addressInput);
      await context.type(paths.addressInput, address);
      // context.comment(Flagpole.toType(addressInput));
      context
        .assert(
          "Address field matches what was typed",
          await addressInput.getValue()
        )
        .equals(address);
      await context
        .assert(
          "Address selection dropdown shows up",
          context.waitForExists(paths.selectAddressButton, 2000)
        )
        .resolves();
      await context.click(paths.selectAddressButton);
      // await context.click(paths.submitButton);
    }
  )
  .next(
    "Review restaurant results page and click a restaurant",
    async (context) => {
      await context.waitForNavigation();
      // const randomRestaurant = await context.waitForHavingText("a", "/^McDonald's");
      await context.waitForVisible(paths.orlandoRestaurantResults, 10000);
      const restaurants = await context.findAll(paths.orlandoRestaurantResults);
      context
        .assert("More than 5 restaurants in results", restaurants.length)
        .greaterThan(5);
      // await context
      //   .assert(
      //     "Click on first restaurant",
      //     context.click(paths.orlandoRestaurantResults)
      //   )
      //   .resolves();
    }
  );
// .next("View restaurant page and verify expected content", async (context) => {
//   const header = await context.waitForExists(paths.restaurantHeader, 2000);
//   context.assert("Restaurant header exists", header).exists();
//   context
//     .assert("Restaurant has a name", await header.getText())
//     .length.greaterThan(0);
//   return context.pause(1);
// });
