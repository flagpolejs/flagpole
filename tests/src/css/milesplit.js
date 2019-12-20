let Flagpole = require('../../dist/index.js').Flagpole;

let suite = Flagpole.Suite('Test MileSplit Stylesheets')
    .base('https://css.sp.milesplit.com')
    .finally(() => { suite.print(); });

suite.stylesheet('Default CSS').open('/drivefaze/default.css').next(async function () {
    const body = await this.find('body');
    const background = await body.getProperty('background');
    this.assert(background).equals('#ebebeb');
});

