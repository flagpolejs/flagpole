let Flagpole = require('../../dist/index.js').Flagpole;

let suite = Flagpole.Suite('Test MileSplit')
    .base('https://www.milesplit.com')
    .finally(() => { suite.print(); });

suite.html('Test MileSplit Hompage').open('/')
    .next('Load up homepage and verify response', function () {
        this.assert('HTTP Status is 200', this.response.httpStatusCode).equals(200);
        this.assert('Content type is HTML', this.response.header('content-type')).contains('text/html');
    })
    .next('Look for images in top stories', async function () {
        const coverImages = await this.selectAll('section.topStories figure img');
        this.assert('There should be at least 4 top stories', coverImages.length)
            .greaterThanOrEquals(4);
        return coverImages;
    })
    .next('Verify images load', async function () {
        const coverImages = await this.result;
        this.assert('Every cover image has src attribute', coverImages).every(async function(image) {
            return (await image.hasAttribute('src'));
        });
        coverImages.forEach(async function (image, i) {
            image.load(`Load Cover Image ${i + 1}`, async function () {
                this.assert('Width is 620', await this.select('width')).equals(620);
            });
        });
    })
    .next('Verify CSS', async function (response, context) {
        const css = await this.selectAll('link[rel="stylesheet"]');
        css.forEach(stylesheet => {
            stylesheet.load(async function () {
                const body = await this.select('body');
                if (!body.isNull()) {
                    const background = await body.getProperty('background');
                    context.comment(background.toString());
                }
            });
        });
    })
    .next('Click first meet and load it', async function () {
        const firstMeetCoverage = await this.select('.meetCoverage article a');
        //firstMeetCoverage.click('Load first meet', function (response) {
        //    this.comment('hi');
        //});
    });