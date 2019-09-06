# AssertionContext

This object gives you all the tools you need for your `next` callbacks within a Scenario operate. It gives you all the handy methods and properties that you need. It will be the default `this` context (when you do not use arrow functions) and it will be the first argument in the callback.

## Properties 

### browser: Browser | null

The Browser object that we can use the interact with Pupetter or null if this is not a browser type Scenario.

### page: Puppeteer.Page | null

The Page object from the Puppeteer browser instance. This will be null if not a browser scenario or for some reason Puppeteer fails to load it. You can use this to interact directly with Puppeteer (see the Puppeteer API for that) it is very useful for things that Flagpole does not directly implement through sugar syntax wrappers.

### response: iResponse

The response from the request. This will vary based on the type of Scenario, but some underlying properties are constant in the interface. 

This is often used to pull something like the load time, HTTP Status, headers, mime type, raw response body, etc.

### result: any

If you chain multiple next callbacks together in a Scenario, you can return a value from one and then pull it into the following. To do this you will use this result to grab that previously returned value. You may find that it is wrapped in a promise and then do await this result to handle that.

```
.next(await function() {
  const articles = context.selectAll('article');
  context.assert(articles.length).greaterThan(0);
  return articles;
})
.next(await function() {
  const articles = await context.result;
  context.comment(await articles[0].getAttribute('id'));
})
```

### scenario: Scenario

A reference to the calling Scenario.

### suite: Suite

The parent Suite of this Scenario.

## Methods

### assert(value: any): Assertion

Creates an assertion with the input value.

```javascript
context.assert(await context.find('article.topStory h1'))
```

### clear(selector: string): Promise<void>

Clear the existing text in this input and then type this text into the selected path. 

```javascript
await context.clear('input[name="q"]');
```

### clearThenType(path: string, textToType: string, opts: any): Promise<void>

Clear the existing text in this input and then type this text into the selected path. For browser scenarios this will be emulating literally pressing keys into the browser. For HTML scenarios it overwrite the value of that element.

```javascript
await context.clearThenType('input[name="q"]', 'who shot 2pac?');
```

### click(path: string): Promise<void | Scenario>

Issues a click on the selected element. This works on both browser and html types. For browser, the click event will be passed through to the underlying browser. For html scenarios, it will navigate a link or submit a form, if you click on a submit button or a link.

```javascript
await context.click('input[name="q"]');
```

For html types, the promise will return a new dynamic scenario that will load the resulting page navigation.

```
(await context.click('a.login')).next(fuction() {
  context.assert(response.statusCode.equals(200);
});
```

### comment(message: string)

Add a comment to the Scenario output.

### exists(path: string): Promise<DOMElement | CSSRule | Value>

This is just like an `exists`, but it also does an assertion that the element actually exists. It is similar to `waitForExists` except that it doesn't wait around.

```javascript
const firstArticle = await context.exists('section.topStories article');
```

### evaluate(callback: Function): Promise<any>

Passes this function off to the underlying response to run it in the context of that type. 

For example, if this is a browser type the callback will be handed off to Puppeteer and actually run within the browser. Like this...

```javascript
const url = await context.evaluate(() => {
  return window.location.href;
});
```

As you can see, you can not only execute the code in that browser's context, but you can reach in and return values from it.

If this is a Cheerio html type scenario, you can execute against the raw Cheerio jQuery-like DOM parser.

```javascript
const loginText = await context.evaluate(($) => {
  return $('a.login').first('span').text();
});
```

For a REST API response context.is less useful perhaps, but you are passed the JSON response to do something with like this.

```javascript
const loginText = await context.evaluate((json) => {
  return json.meta.totalResults;
});
```

In theory, with any of these types, you could also manipulate the response with this method.

### find(path: string): Promise<DOMElement | CSSRule | Value>

Select the element or value at the given path. What this actually does varies by the type of scenario. 

Browser and Html tests both return DOMElement. Stylesheet requests return CSSRule and JSON/REST scenarios return a Value.

Note it returns only one element. If multiple match the path then it returns the first. If none match then it returns null.

```javascript
const firstArticle = await context.find('section.topStories article');
```

### findAll(path: string): Promise<DOMElement[] | CSSRule[] | Value[]>

Select the elements or values at the given path. What this actually does varies by the type of scenario. Browser and Html tests both return DOMElement. Stylesheet requests return CSSRule and JSON/REST scenarios return a Value.

This always returns an array. It will be an empty array if nothing matched. The array elements themselves will be the same object types that you'd have gotten from .find(path).

```javascript
const articles = await context.findAll('section.topStories article');
```

### findAllHavingText(selector: string, searchForText: string | RegExp): Promise<DOMElement[]>

Find the elements matching the given selector that have the given text. The second argument can either be a string, which will match on an equality basis, or a regular expression if you want some more leeway.

Returns an array of DOM Elements for any that match.

```javascript
const itemsContainingTupac = await context.findAllHavingText('li', /tupac/i);
const itemsExactlyTupac = await context.findAllHavingText('li', 'tupac');
```

### findHavingText(selector: string, searchForText: string | RegExp): Promise<DOMElement | Value>

Find the first element matching the given selector that have the given text. The second argument can either be a string, which will match on an equality basis, or a regular expression if you want some more leeway.

Returns an array of DOM Elements for any that match.

```javascript
const buttonContainingYes = await context.findAllHavingText('button', /yes/i);
const buttonExactlyYes = await context.findAllHavingText('button', 'Yes');
```

### openInBrowser(): Promise<string>

Saves the response body to a temporary file and opens it in a browser. This is really only for debugging. The promise resolves to the string of the temporary file.

### pause(milleseconds: number): Promise<void>

Delay the execution by this much

```javascript
await context.pause(1000);
```

### screenshot(opts?: any): Promise<Buffer | string>

Takes a screenshot of that point in time. Currently this is only supported in a browser-based scenario. For the opts argument, see the [Puppeteer documentation for page.screenshot](https://pptr.dev/#?product=Puppeteer&version=v1.19.0&show=api-pagescreenshotoptions).

```javascript
const screenshot = await context.screenshot({ type: 'png', omitBackground: true });
```

### select(selector: string, value: string | string[]): Promise<string[]>

Select items in a dropdown or multi-select box.

```javascript
await context.select('select[name="favoriteSport"]', 'Track & Field');
```

### submit(path: string): Promise<void | Scenario>

Submits the form, if the selected element is a form. This works on both browser and html types. For browser, it will do whatever submitting the form would do in the browser window. For html scenarios, it will serialize the form input and then submit it, navigating to the next page.

```javascript
await context.submit('form#search');
```

For html types, the promise will return a new dynamic scenario that will load the resulting page navigation.

```javascript
(await context.submit('form.search')).next((context) => {
  context.assert(context.response.statusCode).equals(200);
});
```

### type(path: string, textToType: string, opts: any): Promise<void>

Type this text into the selected path. For browser scenarios this will be emulating literally typing into the browser. For HTML scenarios it set the value of that element.

```javascript
await context.type('input[name="q"]', 'who shot 2pac?');
```

### waitForReady(timeout: number = 10000): Promise<void>

Wait for `timeout` milliseconds for the browser's navigation to complete. This really only makes sense in a browser-based scenario. This is shorthand for the `domcontentloaded` in the Puppeteer API.

### waitForExists(path: string, timeout: number): Promise<DOMElement>

Test if an element exists at that path. For a browser scenario it will wait a certain timeout (default 100ms) for the element to show up. If you want it to wait longer, set the timeout value in the second argument.

```javascript
const button = await context.waitForExists('a.submit', 2000);
```

### waitFoHidden(path: string): Promise<DOMElement>

Checks if an element at this selector is hidden (display none or visibility hidden). This only makes sense for browser tests, it will error for other types of scenario. By default it will wait for 100ms for the element to show up, you can change the timeout with the second argument.

```javascript
const button = await context.waitFoHidden('button[type="submit"]', 2000);
```

### waitForLoad(timeout: number = 10000): Promise<void>

Wait for `timeout` milliseconds for the browser's navigation to complete. This really only makes sense in a browser-based scenario. This is shorthand for the `load` in the Puppeteer API.

### waitForNetworkIdle(timeout: number = 10000): Promise<void>

Wait for `timeout` milliseconds for the browser's navigation to complete. This really only makes sense in a browser-based scenario. This is shorthand for the `networkidle0` in the Puppeteer API.


### waitForNavigation(timeout: number = 10000, waitFor?: string | string[]): Promise<void>

Wait for `timeout` milliseconds for the browser's navigation to complete. This really only makes sense in a browser-based scenario.

Default waitFor value is `networkidle2`, as defined in the Puppeteer API.

### waitForVisible(path: string): Promise<DOMElement>

Checks if an element at this selector is visible. This only makes sense for browser tests, it will error for other types of scenario. By default it will wait for 100ms for the element to show up, you can change the timeout with the second argument.

```javascript
const button = await context.waitForVisible('button[type="submit"]', 2000);
```
