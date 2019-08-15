const Flagpole = require('../../dist/index.js').Flagpole;

const suite = Flagpole.Suite('Test Google')
    .base('http://www.google.com')
    .finally(suite => suite.print());

const homepage = suite.html('Homepage').open('/')
    .next('Test basic HTTP headers', async function () {
        this.assert(this.response.statusCode).equals(200);
        this.assert(this.response.header('content-type')).contains('text/html');
        this.assert('hello').length.equals(5);
        this.assert(5).type.equals('number');
    })
   
    .next(async function () {
        const submitButton = await this.find('input[type="submit"]');
        this.comment(submitButton);
        this.assert(await submitButton.getAttribute('value'))
            .in(["Google Search", "Search"]);
    }) 
    .next('Verify all images load', async function () {
        const images = await this.findAll('img');
        this.assert(images).length.greaterThan(0).and.lessThan(99);
        this.assert('Should be at least one image on the page', images.length)
            .greaterThan(0);
        
        images.forEach(async function (img, index) {
            (await img.load('Image ' + index))
                .next(async (imageContext) => {
                    imageContext.assert(imageContext.response.length).greaterThan(0);
                    imageContext.assert(await imageContext.find('width')).greaterThan(100);
                });
        });
        
    }) 
    .next(async function() {
        const form = await this.find('form');
        this.assert('Should be a form', form).not.equals(null);
        this.assert('Form action attribute should be /search', await form.getAttribute('action'))
            .equals('/search');
        await form.fillForm({
            q: 'milesplit'
        });
        const input = await this.find('input[name="q"]');
        this.assert(input).exists()
        const value = await input.getValue();
        this.assert(value).equals('milesplit');
        form.submit('Submit form and check results page', async function () {
            const searchInputBox = await this.find('input[name="q"]');
            this.assert('Search input box should have the value we typed', await searchInputBox.getValue())
                .equals('milesplit');
            this.comment(await this.openInBrowser());
        });
    });
