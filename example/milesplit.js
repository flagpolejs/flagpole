let Flagpole = require('../dist/index.js').Flagpole;

let suite = Flagpole.Suite('Test MileSplit')
    .base('https://www.milesplit.com')
    .success(() => {
        console.log('suite success');
    })
    .finally((suite) => {
        console.log('suite finally');
        suite.print();
    });

suite.Scenario('Homepage').open('/')
    .success(() => {
        console.log('scenario success');
    })
    .catch(() => {
        console.log('scenario catch');
    })
    .finally(() => {
        console.log('scenario finally');
    })
    .then((response) => {
        response.status().equals(200);
    })
    .then((response) => {
        response.headers('content-type').contains('text/html');
    })
    .then((response) => {
        console.log(this);
        const coverImages = response.select('section.topStories figure img');
        coverImages.length().echo();
        coverImages.each(function (image, index) {
            image.load('Cover Image #' + (index + 1)).then((img) => {
                img.select('width').equals(620);
                img.select('height').equals(349);
            });
        });
    });
