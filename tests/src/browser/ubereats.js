const Flagpole = require("../../dist/index.js").Flagpole;

const suite = Flagpole.Suite("Uber Eats Sample Test").base(
  "https://www.ubereats.com/"
);

const paths = {
  addressInput: 'div[aria-label="enter address"] input',
  selectAddressButton: "form ul button",
  submitButton: 'form button[type="submit"]',
  orlandoRestaurantResults: 'a[href^="/en-US/orlando/food-delivery"]',
  restaurantHeader: "h1",
};

const address = "2180 W State Rd 434, Longwood, FL 32779";

suite
  .browser("Start on homepage and find local restaurants", {
    headless: false,
  })
  .open("/")
  .next(
    "Go to front page, type in an address, and click search",
    async function () {
      const addressInput = await this.waitForVisible(paths.addressInput, 15000);
      await this.assert("Address input box is visible", addressInput).exists();
      await this.click(paths.addressInput);
      await this.type(paths.addressInput, address);
      this.comment(Flagpole.toType(addressInput));
      this.assert(
        "Address field matches what was typed",
        await addressInput.getValue()
      ).equals(address);
      await this.assert(
        "Address selection dropdown shows up",
        this.waitForExists(paths.selectAddressButton, 2000)
      ).resolves();
      await this.click(paths.selectAddressButton);
      await this.click(paths.submitButton);
    }
  )
  .next(
    "Review restaurant results page and click a restaurant",
    async function () {
      await this.waitForNavigation();
      await this.waitForVisible(paths.orlandoRestaurantResults, 10000);
      const restaurants = await this.findAll(paths.orlandoRestaurantResults);
      this.assert(
        "More than 5 restaurants in results",
        restaurants.length
      ).greaterThan(5);
      await this.assert(
        "Click on first restaurant",
        this.click(paths.orlandoRestaurantResults)
      ).resolves();
    }
  )
  .next("View restaurant page and verify expected content", async function () {
    const header = await this.waitForExists(paths.restaurantHeader, 2000);
    await this.assert("Restaurant header exists", header).exists();
    this.assert(
      "Restaurant has a name",
      await header.getText()
    ).length.greaterThan(0);
    return this.pause(1);
  });
