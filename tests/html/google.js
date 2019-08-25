let Flagpole = require('../../dist/index.js').Flagpole;

const suite = Flagpole.Suite('Test Google')
    .base('http://www.google.com');

const homepage = suite.html('Homepage').open('/')
    .next('Test basic HTTP headers', async (context) => {
        context.assert(context.response.statusCode).equals(200);
        context.assert(context.response.header('content-type')).contains('text/html');
        context.assert('hello').length.equals(5);
        context.assert(5).type.equals('number');
        context.assert('foo');
    })
    .next(async (context) => {
        context.assert('bar');
        const submitButton = await context.find('input[type="submit"]');
        context.assert('sadfa');
        context.comment(submitButton);
        context.assert(await submitButton.getAttribute('value'))
            .in(["Google Search", "Search"]);
    }) 
    .next('Verify all images load', async (context) => {
        const images = await context.findAll('img');
        context.assert(images).length.greaterThan(0).and.lessThan(99);
        context.assert('Should be at least one image on the page', images.length)
            .greaterThan(0);
        
        images.forEach(async function (img, index) {
            (await img.load('Image ' + index))
                .next(async (imageContext) => {
                    imageContext.assert(imageContext.response.length).greaterThan(0);
                    imageContext.assert(await imageContext.find('width')).greaterThan(100);
                });
        });
        
    }) 
    .next(async (context) => {
        const form = await context.find('form');
        context.assert('Should be a form', form).not.equals(null);
        context.assert('Form action attribute should be /search', await form.getAttribute('action'))
            .equals('/search');
        await form.fillForm({
            q: 'milesplit'
        });
        const input = await context.find('input[name="q"]');
        context.assert(input).exists()
        const value = await input.getValue();
        context.assert(value).equals('milesplit');
        form.submit('Submit form and check results page', async (context) => {
            const searchInputBox = await context.find('input[name="q"]');
            context.assert('Search input box should have the value we typed', await searchInputBox.getValue())
                .equals('milesplit');
        });
    });
