const Flagpole = require('../../dist/index.js').Flagpole;
const bluebird = require('bluebird');
const uiTestHelper = require("../util/uiTestHelper");
const loginHelper = require("../util/loginHelper");
const waitForHelpers = require("../util/waitForHelpers");
const closeDialogHelper = require("../util/closeDialogHelper");
const launchOptionsHelper = require("../util/launchOptionsHelper");
const testConstants = require("../util/test-constants");

const EVENT_STREAM_NAME = 'AUTOMATION-WRESTLING-TESTT';
const SPORT_NAME = 'FloWrestling';

Flagpole.exitOnDone = true;

const wrestlingTest = function() {
    return new Promise(function (resolve, reject) {
        const suite = Flagpole.Suite('Test '+ SPORT_NAME +' Scorecard UI')
            .base('https://floscorecard-staging.firebaseapp.com')
            .onDone(() => {
                suite.print();
            })

        const browserOpts = {
            headless: false,
            recordConsole: false,
            outputConsole: false,
            width: 1024,
            height: 768,
        };

        launchOptionsHelper.puppeteerLaunchOptions(browserOpts, process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD);

        const login = suite.Scenario(SPORT_NAME)
            .browser(browserOpts)
            .open('/')
        .then((response) => {
            response.assert(response.status() == 200, 'Homepage Status 200');
        })

        // Login
        .then((response) => { return loginHelper.login(response) })
        // Choose a Sport -- WRESTLING
        .then((response) => { return uiTestHelper.selectSport(response, SPORT_NAME) })
        // Choose an Event -- AUTOMATION-WRESTLING-TEST
        .then((response) => { return uiTestHelper.selectEventStream(response, EVENT_STREAM_NAME) })
        // Choose a Stream -- AUTOMATION-WRESTLING-TEST
        .then((response) => { return uiTestHelper.selectEventStream(response, EVENT_STREAM_NAME) })
        // Fill in Bout Data
        .then((response) => {
            response.assert(response.status() == 200, 'Bout Info Status 200');
            const page = uiTestHelper.getPageForResponse(response);

            // First, make sure everything is really loaded using a waitFor
           return waitForHelpers.waitForSelector(page, testConstants.buttonPrimary)

            // Go through form elements and fill in test data
            .then(() => {
                return bluebird.mapSeries([
                    () => page.select('#style', 'greco'),
                    () => uiTestHelper.type(page, 'input[name="division"]', 'Scorecard Test', true), 
                    () => uiTestHelper.type(page, 'input[name="weightClass"]', '65', true),
                    () => page.select('#weight-unit', 'kg'),
                    () => page.select('#round', 'FINALS'),
                    () => uiTestHelper.type(page, 'input#bout-number', '654321', true),
                    () => page.select('#show-riding-time', '0: false'),
                    () => page.select('#scorebot-mode', '0: false'),
                    () => uiTestHelper.type(page, 'input#athlete1', 'Alex Pierce', true),
                    () => uiTestHelper.type(page, 'input[name="rank1"]', '1', true),
                    () => uiTestHelper.type(page, 'input[name="team1"]', 'The Best', true),
                    () => page.select('#country1', 'US'),
                    () => uiTestHelper.type(page, 'input[name="athlete2"]', 'Matt Mulford', true),
                    () => uiTestHelper.type(page, 'input[name="rank2"]', '2', true),
                    () => uiTestHelper.type(page, 'input[name="team2"]', 'The Second Best', true),
                    () => page.select('#country2', 'US'),
                    () => page.click(testConstants.buttonPrimary),
                ], (func) => func());
            })
            .then(() => page.waitForNavigation({ waitUntil: 'networkidle2' }));
        })
        // Score and End Bout
        .then((response) => {
            response.assert(response.status() == 200, 'Score Bout and End Bout Status 200');
            const page = uiTestHelper.getPageForResponse(response);

            // First, make sure everything is really loaded using a waitFor
            return waitForHelpers.waitForSelector(page, testConstants.buttonPrimary)
            // Score and end bout
            .then(() => {
                return bluebird.mapSeries([
                    () => page.select('#period', '2nd'),
                    () => page.click('#athlete1-points button:nth-child(2)'),
                    () => page.click('#athlete1-points button:nth-child(2)'),
                    () => page.click('#athlete1-points button:nth-child(2)'),
                    () => page.click('#athlete2-points button:nth-child(2)'),
                    () => page.click('#athlete2-points button:nth-child(2)'),
                    () => page.click('#athlete2-points button:nth-child(2)'),
                    () => page.click(testConstants.buttonPrimary),
                    // let modal show and render
                    () => page.waitFor(2000),
                    () => uiTestHelper.findAndClickButtonByText(page, 'Confirm', testConstants.buttonPrimary),
                    // let custom dialog show and render
                    () => page.waitFor(1000),
                    () => page.click('body span:nth-child(1) > button'),
                ], (func) => func());
            })
            .then(() => page.waitForNavigation({ waitUntil: 'networkidle2' }));
        })
        // Click Next Bout 
        .then((response) => {
            response.assert(response.status() == 200, 'Finish Bout Status 200');
            const page = uiTestHelper.getPageForResponse(response);

            // First, make sure everything is really loaded using a waitFor
            return waitForHelpers.waitForSelector(page, testConstants.buttonPrimary)
            .then(() => page.click(testConstants.buttonPrimary));
        })
        .then(function () {
            resolve();
        })
        .catch((err) => {
            reject(err);
        });
    });
}
wrestlingTest();
exports.wrestlingTest = wrestlingTest;
