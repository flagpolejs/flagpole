const Flagpole = require('../../dist/index.js').Flagpole;
Flagpole.exitOnDone = true;

const suite = Flagpole.Suite('Uber Eats Sample Test')
    .base('https://www.ubereats.com/')
    .finally(() => { suite.print(); });

const paths = {
    addressInput: 'div[aria-label="enter address"] input',
    selectAddressButton: 'form ul button',
    submitButton: 'form button[type="submit"]',
    orlandoRestaurantResults: 'a[href^="/en-US/orlando/food-delivery"]',
    restaurantHeader: 'h1'
}

const address = '2180 W State Rd 434, Longwood, FL 32779'

suite.Browser('Start on homepage and find local restaurants', { headless: false })
    .open('/')
    .then('Go to front page, type in an address, and click search', async function () {
        await this.assert('Address input box is visible', this.visible(paths.addressInput)).resolves();
        await this.click(paths.addressInput);
        await this.type(paths.addressInput, address);
        this.assert('Address field matches what was typed', await this.val(paths.addressInput)).equals(address);
        await this.assert(
            'Address selection dropdown shows up',
            this.exists(paths.selectAddressButton, { timeout: 2000 })
        ).resolves();
        await this.click(paths.selectAddressButton);
        await this.click(paths.submitButton);
    })
    .then('Review restaurant results page and click a restaurant', async function () {
        await this.page.waitForNavigation();
        await this.visible(paths.orlandoRestaurantResults, { timeout: 10000 });
        this.assert('More than 5 restaurants in results', (await this.selectAll(paths.orlandoRestaurantResults)).length)
            .greaterThan(5);
        await this.assert('Click on first restaurant', this.click(paths.orlandoRestaurantResults)).resolves();
    })
    .then('View restaurant page and verify expected content', async function () {
        await this.assert('Restaurant header exists', this.exists(paths.restaurantHeader, { timeout: 2000 })).resolves();
        this.assert('Restaurant has a name', (await this.text(paths.restaurantHeader)).trim().length)
            .greaterThan(0);
        return this.pause(1);
    })
    /*
    .then(function () {
        return this.page.click(paths.addressInput);
    })
    .then('Typing in the address', function () {
        return this.page.type(paths.addressInput, address);
    })
    .then(async function () {
        const value = await this.page.$eval(paths.addressInput, el => el.value);
        return this.asyncAssert(value == address, 'Address field is ' + address);
    })
    .then(function () {
        return this.resolves(
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
    .then('Wait for results', function () {
        return this.resolves(
            this.page.waitForSelector(paths.orlandoRestaurantResults, { timeout: 10000 }),
            'Restaurant results show up'
        );
    })
    .then(async function () {
        const results = await this.page.$$(paths.orlandoRestaurantResults);
        return this.asyncAssert(() => {
            return results.length > 5
        }, 'There are more than five restaurants to choose from');
    })
    .then('Click on first result', function () {
        return this.page.click(paths.orlandoRestaurantResults);
    })
    .then('Waiting for restaurant page to load', function () {
        return this.resolves(
            this.page.waitForSelector(paths.restaurantHeader, { timeout: 1000 }),
            'Found restaurant page header'
        );
    })
    .then(async function () {
        const text = await this.page.$eval(paths.restaurantHeader, el => el.textContent);
        return this.asyncAssert(text.trim().length > 0, 'Has restaurant name: ' + text);
    });
    */