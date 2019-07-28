const Flagpole = require('../../dist/index.js').Flagpole;
Flagpole.exitOnDone = true;

const suite = Flagpole.Suite('Uber Eats Sample Test')
    .base('https://www.ubereats.com/')
    .finally((suite) => {
        suite.print();
    });

const paths = {
    addressInput: 'div[aria-label="enter address"] input',
    selectAddressButton: 'form ul button',
    submitButton: 'form button[type="submit"]',
    orlandoRestaurantResults: 'a[href^="/en-US/orlando/food-delivery"]',
    restaurantHeader: 'h1'
}

const address = '2180 W State Rd 434, Longwood, FL 32779'

suite.Scenario('Homepage')
    .browser({ headless: false })
    .open('/')
    .then(function () {
        return this.response.asyncSelect(paths.addressInput);
    })
    .then(function () {
        return this.page.click(paths.addressInput);
    })
    .then('Typing in the address', function () {
        return this.page.type(paths.addressInput, address);
    })
    .then(async function () {
        const value = await this.page.$eval(paths.addressInput, el => el.value);
        return this.scenario.asyncAssert(() => {
            return value == address;
        }, 'Address field is ' + address);
    })
    .then(function () {
        return this.scenario.assertResolves(
            this.page.waitForSelector(paths.selectAddressButton, { timeout: 2000 }),
            'Address selection dropdown shows up'
        );
    })
    .then('Select the address and click submit', function () {
        return this.page.click(paths.selectAddressButton);
    })
    .then(function () {
        return this.page.click(paths.submitButton);
    })
    .then(function () {
        this.response.comment('Wait for results');
        return this.scenario.assertResolves(
            this.page.waitForSelector(paths.orlandoRestaurantResults, { timeout: 10000 }),
            'Restaurant results show up'
        );
    })
    .then(async function () {
        const results = await this.page.$$(paths.orlandoRestaurantResults);
        return this.scenario.asyncAssert(() => {
            return results.length > 5
        }, 'There are more than five restaurants to choose from');
    })
    .then(function () {
        this.response.comment('Click on first result');
        return this.page.click(paths.orlandoRestaurantResults);
    })
    .then(async function () {
        this.response.comment('Waiting for restaurant page to load');
        return this.scenario.assertResolves(
            this.page.waitForSelector(paths.restaurantHeader, { timeout: 1000 }),
            'Found restaurant page header'
        );
    })
    .then(async function () {
        const text = await this.page.$eval(paths.restaurantHeader, el => el.textContent);
        return this.scenario.asyncAssert(() => {
            return text.trim().length > 0
        }, 'Has restaurant name: ' + text);
    });