const Flagpole = require('../../dist/index.js').Flagpole;
const suite = Flagpole.suite('Basic Smoke Test of Site')
    .base('http://staging-arena.flowrestling.org/');

const opts = {
    width: 1280,
    height: 600,
    headless: false
}

const selectors = {
    sectionHeaders: '.section > div.events > h4'
}

suite.browser("Homepage Loads Stuff", opts)
    .open('/')
    .next(async context => {
        context.assert('HTTP Status equals 200', context.response.statusCode).equals(200);
        await context.waitForExists(selectors.sectionHeaders, 10000);
        const h4s = await context.findAll(selectors.sectionHeaders);
        context.assert(h4s).length.equals(3);
        context.assert('First section says Live Today', await h4s[0].getText()).like('Live Today');
        context.assert('Second section says upcoming', await h4s[1].getText()).like('Upcoming');
        context.assert('Third section says Results', await h4s[2].getText()).like('Results');
    })
    .next(async context => {
        const listItems = await context.findAll('.upcoming .events-group li');
        const firstItem = listItems[0];
        context.assert('More that one list item in upcoming', listItems).length.greaterThan(0);
        context.assert('Found first li', firstItem).exists();
        context.comment(await firstItem.getText());
        const secondItem = await firstItem.getNextSibling();
        context.comment(await secondItem.getText());
        context.assert('Text of second item contains registration', await secondItem.getText()).contains('Registration');
        const ul = await firstItem.getParent();
        context.assert('ul has class list', await ul.hasClassName('list')).equals(true);
        context.assert('got next siblings', await firstItem.getNextSiblings()).length.greaterThan(0);
        context.assert('got siblings', await firstItem.getSiblings()).length.greaterThan(0);
        context.assert('no previous siblings', await firstItem.getPreviousSiblings()).length.equals(0);
        context.assert('found lis', await ul.findAll('li')).length.greaterThan(0);
        context.assert('find title, should fail', await ul.findAll('title')).length.equals(0);
        const firstLink = await ul.find('a[href]');
        context.assert('link is valid', firstLink).not.equals(null);
        context.assert(' get children', await ul.getChildren('li')).length.not.equals(0);
        context.comment('load it');
        await firstLink.click('Click first link', async (context) => {
            context.comment('hi');
        });
        context.comment('loaded it');
    });

suite.browser("Check Log in and log out", opts)
    .open("/")
    .next('Load Arena Homepage', async context => {
        const loginLink = await context.waitForExists('a.login', 10000);
        context.assert(await loginLink.getText()).like('Log in');
        //click on login link
        return loginLink.click();
    })
    .next('Load Login page', async context => {
        await context.waitForNavigation(20000);
        context.assert(await context.find('h1.funnel-title')).exists();
    });