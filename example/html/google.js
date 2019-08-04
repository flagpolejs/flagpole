const Flagpole = require('../../dist/index.js').Flagpole;

const suite = Flagpole.Suite('Test Google')
    .base('http://www.google.com')
    .finally(function (suite) {
        suite.print();
    });

const homepage = suite.html('Homepage').open('/')
    .next('Test basic HTTP headers', async function (response, context) {
        this.assert(response.status()).equals(200);
        this.assert(response.headers('content-type')).contains('text/html');
    })
   
    .next(async function (response, context) {
        const submitButton = await this.select('input[type="submit"]');
        this.assert(await submitButton.getAttribute('value'))
            .in(["Google Search", "Search"]);
    }) 
    .next('Verify all images load', async function () {
        const images = await this.selectAll('img');
        this.assert('Should be at least one image on the page', images.length)
            .greaterThan(0);
        
        images.forEach(async function (img, index) {
            (await img.load('Image ' + index))
                .next(function (response) {
                    this.assert(response.length()).greaterThan(0);
                });
        });
        
    }) 
    .next(async function() {
        const form = await this.select('form');
        this.assert('Should be a form', form).notEquals(null);
        this.assert('Form action attribute should be /search', await form.getAttribute('action'))
            .equals('/search');
        await form.fillForm({
            q: 'milesplit'
        });
        form.submit('Submit form and check results page', async function () {
            const searchInputBox = await this.select('input[name="q"]');
            this.assert('Search input box should have the value we typed', await searchInputBox.getValue())
                .equals('milesplit');
        });
    });
