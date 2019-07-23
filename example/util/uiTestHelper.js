const Flagpole = require('../../dist/index.js').Flagpole;
const bluebird = require('bluebird');
const waitForHelpers = require("./waitForHelpers");

const type = function (page, inputSelector, inputText, clearFirst) {
    if (clearFirst) {
        return bluebird.mapSeries([
            () => page.$$eval(inputSelector, input => input.map(input => input.value = '')),
            () => page.type(inputSelector, inputText),
        ], (func) => func());
    } else {
        return bluebird.mapSeries([
            () => page.type(inputSelector, inputText)
        ], (func) => func());
    }
}

const getPageForResponse = function (response) {
    const scenario = response.scenario;
    const browser = scenario.getBrowser();

    return browser.getPage();
}

const findAndClickButtonByText = function (page, text, selector) {
    return page.waitForFunction((text, selector) => Array.from(document.querySelectorAll(selector)).filter(button => (button.textContent || '').indexOf(text) > -1).length > 0, {
        polling: 250,
        timeout: 5000,
    }, text, selector)
    .then(() => page.evaluateHandle((text, selector) => Array.from(document.querySelectorAll(selector)).filter(button => (button.textContent || '').indexOf(text) > -1)[0], text, selector))
    .then((element) => {
        return element.click();
    });
}

const findAndClickAllElementsByClass = function (page, selector) {
    return page.waitForFunction((selector) => Array.from(document.querySelectorAll(selector)).length > 0, {
        polling: 250,
        timeout: 5000,
    }, selector)
    .then(() => page.$$(selector))
    .then((elements) => {
        return bluebird.each(elements, function(element) {
            if (element) {
                return element.click();
            } else {
                throw new Error('Element does not exist');
            }
        });
    });
 }

const waitForClockTick = function (page, timeToClick) {
    return page.waitFor(timeToClick);
}

const selectSport = function(response, SPORT_NAME) {
    response.assert(response.status() == 200, 'Choose a Sport Status 200');
    const page = getPageForResponse(response);

    return waitForHelpers.waitForTextInSelector(page,'a > span', SPORT_NAME);
}

const selectEventStream = function(response, EVENT_STREAM_NAME) {
    response.assert(response.status() == 200, 'Choose an Event Status 200');
    const page = getPageForResponse(response);

    return waitForHelpers.waitForTextInSelector(page, 'a > span', EVENT_STREAM_NAME);
}


exports.waitForClockTick = waitForClockTick;
exports.getPageForResponse = getPageForResponse;
exports.type = type;
exports.findAndClickButtonByText = findAndClickButtonByText;
exports.findAndClickAllElementsByClass = findAndClickAllElementsByClass;
exports.selectSport = selectSport;
exports.selectEventStream = selectEventStream;
