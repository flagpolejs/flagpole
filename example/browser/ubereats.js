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

suite.browser('Start on homepage and find local restaurants', { headless: false })
    .open('/')
    .next('Go to front page, type in an address, and click search', async function () {
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
    .next('Review restaurant results page and click a restaurant', async function () {
        await this.page.waitForNavigation();
        await this.visible(paths.orlandoRestaurantResults, { timeout: 10000 });
        const restaurants = await this.selectAll(paths.orlandoRestaurantResults);
        this.assert('More than 5 restaurants in results', restaurants.length).greaterThan(5);
        await this.assert('Click on first restaurant', this.click(paths.orlandoRestaurantResults)).resolves();
    })
    .next('View restaurant page and verify expected content', async function () {
        await this.assert('Restaurant header exists', this.exists(paths.restaurantHeader, { timeout: 2000 })).resolves();
        this.assert('Restaurant has a name', (await this.text(paths.restaurantHeader)).length)
            .greaterThan(0);
        return this.pause(1);
    });
    