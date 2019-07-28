let Flagpole = require('../dist/index.js').Flagpole;

let suite = Flagpole.Suite('Test MileSplit')
    .base('https://www.milesplit.com')
    .finally(() => { suite.print(); });

suite.Scenario('Test MileSplit Hompage').open('/')
    .then((response) => {
        response.status().equals(200);
        response.headers('content-type').contains('text/html');
    })
    .then('Look for images in top stories', (response) => {
        const coverImages = response.select('section.topStories figure img');
        coverImages.length().greaterThan(4);
        return coverImages;
    })
    .then(function () {
        this.result.each(function (image, index) {
            image.load('Cover Image #' + (index + 1))
                .then((img) => {
                    img.select('width').equals(620);
                    img.select('height').equals(349);
                });
        });
    });
