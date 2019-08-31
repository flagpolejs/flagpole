const Flagpole = require('../../dist/index.js').Flagpole;
const suite = Flagpole.suite('Basic Smoke Test of Site')
    .base('http://staging-arena.flowrestling.org/');

const opts = {
    width: 1280,
    height: 600,
    headless: false
}

suite.browser("Homepage Loads Stuff", opts)
    .open("/")
    .next(async context => {
        context.assert('HTTP Status equals 200', context.response.statusCode).equals(200);
        await context.waitForExists('h4', 4000);
        const h4s = await context.findAll('.section > div.events > h4');
        context.assert(h4s).length.equals(3);
        context.assert(await h4s[0].getText()).like('Live Today');
        context.assert(await h4s[1].getText()).like('Upcoming');
        context.assert(await h4s[2].getText()).equals('foobar');
        context.comment(await h4s[2].getOuterHtml());
    });