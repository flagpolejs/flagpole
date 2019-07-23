const waitForSelector = function (page, selector) {
    return page.waitForFunction((selector) => Array.from(document.querySelectorAll(selector)).length > 0, {
        polling: 250,
        timeout: 5000,
    }, selector)
}

const waitForTextInSelector = function (page, selector, text) {
    return page.waitForFunction((text, selector) => Array.from(document.querySelectorAll(selector)).filter(span => (span.textContent || '').indexOf(text) > -1).length > 0, {
        polling: 250,
        timeout: 5000,
    }, text, selector)

    .then(() => page.evaluateHandle((text, selector) => Array.from(document.querySelectorAll(selector)).filter(span => (span.textContent || '').indexOf(text) > -1).map(span => span.parentElement)[0], text, selector))
    // Click our button.
    .then((element) => {
        element.click();
    }) 
    .then(() => page.waitForNavigation({waitUntil: 'networkidle2'}))
}

exports.waitForTextInSelector = waitForTextInSelector;

exports.waitForSelector = waitForSelector;
