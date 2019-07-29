let Flagpole = require('../dist/index.js').Flagpole;

let suite = Flagpole.Suite('Test MileSplit')
    .base('https://www.milesplit.com')
    .finally(() => { suite.print(); });

suite.Html('Test MileSplit Hompage').open('/')
    .then('Load up homepage and verify response', function () {
        this.assert('HTTP Status is 200', this.response.status()).equals(200);
        this.assert('Content type is HTML', this.response.headers('content-type')).contains('text/html');
    })
    .then('Look for images in top stories', async function () {
        const coverImages = await this.selectAll('section.topStories figure img');
        this.assert('There should be at least 4 top stories', coverImages.length)
            .greaterThanOrEquals(4);
        return coverImages;
    })
    .then(async function (response, context) {
        const coverImages = await this.result;
        coverImages.forEach(async function (element, i) {
            context.comment(await element.getAttribute('src'));
        });
        await this.comment(await (await this.select('.topStories')).getClassName());
    });