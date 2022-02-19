# AssertionContext

This object gives you all the tools you need for your `next` callbacks within a Scenario operate. It gives you all the handy methods and properties that you need. It will be the default `this` context (when you do not use arrow functions) and it will be the first argument in the callback.

## Properties

### browser: Browser | null

The Browser object that we can use the interact with Pupetter or null if this is not a browser type Scenario.

### executionOptions: FlagpoleExecutionOptions

The execution options specified from the command line arguments or defaults. This notably includes environment.

### page: Puppeteer.Page | null

The Page object from the Puppeteer browser instance. This will be null if not a browser scenario or for some reason Puppeteer fails to load it. You can use this to interact directly with Puppeteer (see the Puppeteer API for that) it is very useful for things that Flagpole does not directly implement through sugar syntax wrappers.

### request: HttpRequest

Get the request object.

```javascript
console.log(context.request.method);
```

### response: Response

The response from the request. This will vary based on the type of Scenario, but some underlying properties are constant in the interface.

This is often used to pull something like the load time, HTTP Status, headers, mime type, raw response body, etc.

```javascript
context.request.loadTime
  .assert("Load time was less than a second")
  .lessThan(1000);
```

### result: any

If you chain multiple next callbacks together in a Scenario, you can return a value from one and then pull it into the following. To do this you will use this result to grab that previously returned value. You may find that it is wrapped in a promise and then do await this result to handle that.

```javascript
.next(async (context) => {
  const articles = context.selectAll('article');
  context.assert(articles).length.greaterThan(0);
  return articles;
})
.next(async (context) => {
  const articles = await context.result;
  context.comment(await articles[0].getAttribute('id'));
})
```

### scenario: Scenario

A reference to the calling Scenario.

### suite: Suite

The parent Suite of this Scenario.

## Methods

### assert(): Assertion

#### assert(value: any): Assertion

Creates an assertion with the input value.

```javascript
context.assert(await context.find("article.topStory h1"));
```

The above example alone would not do anything. It would return an assertion object, but you would have not yet made the actual assertion. You would chain on to the end of it to do so:

```javascript
context.assert(await context.find("article.topStory h1")).exists();
```

#### assert(message: string, value: any): Assertion

You can also pass a message as the first argument, which will override the default assertion message.

### clear(selector: string): Promise\<void\>

Clear the existing text in this input and then type this text into the selected path.

```javascript
await context.clear('input[name="q"]');
```

### clearThenType(path: string, textToType: string, opts: any): Promise\<void\>

Clear the existing text in this input and then type this text into the selected path. For browser scenarios this will be emulating literally pressing keys into the browser. For HTML scenarios it overwrite the value of that element.

```javascript
await context.clearThenType('input[name="q"]', "who shot 2pac?");
```

### click(...): Promise<...>

Issues a click on the selected element. This works on both browser and html types. For browser, the click event will be passed through to the underlying browser. For html scenarios, it will navigate a link or submit a form, if you click on a submit button or a link.

There are a few forms of this

#### click(selector: string): Promise\<void\>

```javascript
await context.click('input[name="q"]');
```

#### click(selector: string, message: string): Promise\<Scenario\>

This will select the object and, if it is a clickable element (like a link), it will create a new dynamic scenario with that URL loaded.

```javascript
context.click('a.login', 'Load login page')).next((loginContext) => {
  loginContext.assert(response.statusCode.equals(200));
});
```

It returns a promise that resolves to the dynamic scenario.

#### click(selector: string, callback: Function): Promise\<Scenario\>

Alternately, you can pass a callback for the dynamic scenario as the second argument. The title of the scenario will be automatically created.

```javascript
await context.click("a.login", (loginContext) => {
  loginContext.assert(response.statusCode.equals(200));
});
```

#### click(selector: string, message: string, callback: Function): Promise\<Scenario\>

Or combine the two methods with a message and callback.

```javascript
context.click("a.login", "Load login page", (loginContext) => {
  loginContext.assert(response.statusCode.equals(200));
});
```

#### click(selector: string, subScenario: Scenario): Promise\<Scenario\>

Finally if you have a scenario already and you want to execute it with the link from the element, pass in the reference to that scenario.

```javascript
await context.click("a.login", scenario2);
```

### comment(message: any): AssertionContext

Add a comment to the Scenario output.

```javascript
context.comment("Hello world");
context.comment(`Response length was: ${context.response.length}`);
```

You can also comment out an object or other data type, which will print as JSON.

```javascript
context.comment(context.response.body);
context.comment(json.data);
```

### exists(): Promise\<Value\>

#### exists(selector: string): Promise\<Value\>

This is just like an `find`, but it also does an assertion that the element actually exists. It is similar to `waitForExists` except that it doesn't wait around.

You can use it standalone to just make an assertion:

```javascript
await context.exists("section.topStories article");
```

Or you can grab the element that it returns:

```javascript
const firstArticle = await context.exists("section.topStories article");
```

#### exists(selector: string, contains: string): Promise\<Value\>

Pass in a third argument as a string to test whether the item exists that contains this text.

```javascript
await context.exists(
  "One of the top stories should have 'Breaking' in the headline",
  "section.topStories article"
  "breaking"
);
```

#### exists(selector: string, mathces: RegExp): Promise\<Value\>

This third argument can alternately be a regular expression:

```javascript
await context.exists(
  "One of the top stories should have 'Breaking' in the headline",
  "section.topStories article"
  /Breaking/
);
```

#### exists(selector: string, contains: string | RegExp, opts: FindOps): Promise\<Value\>

As a fourth argument, you can include any of the `opts` properties from `find()`, for example:

```javascript
await context.exists(
  "Should be a button that says `go` in the value field",
  "button"
  "go",
  { findBy: "value" }
);
```

You could also use the `offset` property to test for there being at least n-number of matching items. Remember `offset` is zero-based.

```javascript
await context.exists(
  "There should be at least 4 buttons containing `go` in the text node.",
  "button"
  "go",
  { offset: 3 }
);
```

The `exists` method will return the matched element inside of the Value or a null Value if there is no match.

#### exists(selectors: string[]): Promise\<Value\>

With any variation of `exists`, your first agument can also be an array of selectors. Passing in more than one element for the array will make sure that at least one of them exists, and it will return the first one that does.

```javascript
const firstButtonLikeThing = await context.exists(["button", ".button"]);
```

### existsAll(selector: string | string[], ....)

This method works essentially just like `exists` so see that documentation for details. The difference is that instead of returning the first matching element, it will return an array of all matching elements.

```javascript
const tableBodyRows = await context.existsAll("table tbody tr");
```

You can use any of the arguments that you can use in `exists`. One important distinction, however, is the behavior of passing in more than one selector (as an array) as the first argument. This will assert that at least one element in ALL of those selectors (and any other find criteria) exist. If any of them do not, the assertion will fail.

```javascript
const allTableRows = await context.existsAll([
  "table tbody tr",
  "table thead tr",
]);
```

It will return an array of matching elements from any of those selecetors.

If you do not want it to assert that elements exist for ALL selector paths, instead use `existsAny`. It works the same way, but just asserts that at least one exists.

### existsAny(selector: string[], ....)

This works just like `existsAll`, except that it only asserts that at least one of the selectors existed. Please see the documentation of `exists` and `existsAll` for more details.

```javascript
const buttons = await context.existsAny(["button", "div.button"]);
```

### evaluate(callback: Function): Promise\<any\>

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
  return $("a.login").first("span").text();
});
```

For a REST API response context.is less useful perhaps, but you are passed the JSON response to do something with like this.

```javascript
const loginText = await context.evaluate((json) => {
  return json.meta.totalResults;
});
```

In theory, with any of these types, you could also manipulate the response with this method.

### find(): Promise\<Value\>

#### find(selector: string, opts?: FindOpts): Promise\<Value\>

Select the first matching element or value at the given path. What this actually does varies by the type of scenario.

Note it returns only one element. If multiple match the path then it returns the first. If none match then it returns null.

```javascript
const firstArticle = await context.find("section.topStories article");
```

The `opts` argument here can be used for not grabbing the first matching element, but a later one. Use the `offset` property for that:

```javascript
const secondArticle = await context.find("section.topStories article", {
  offset: 1,
});
```

Note that when finding an Appium element, pass the path as `<selector_strategy>/<value>`. Paths are interpreted with the selector strategy to the left of a forward slash, with the value to the right of the slash.
For instance:

```javascript
const loginButton = await context.find("id/login_button");
```

Valid selector strategies are `id`, `xpath`, `class name`, `accessibility id`, `css selector`. It is only possible to find elements by CSS selector in a Webview context. When testing an Android app with UiAutomator2, you may also use `-android uiautomator`, though it is recommended to use a different strategy, see below. When testing an Android app with Espresso, additional selector strategies include `-android viewtag`, `tag name`, `-android datamatcher`, `-android viewmatcher`, `text`. When testing an iOS app, you may also use `-ios class chain` and `-ios predicate string`. Note that spaces are valid in the selector strategy.

#### find(selector: string, contents: string, opts?: FindOpts): Promise\<Value\>

Find the first element matching the given selector that have the given text. The second argument is a string of the text we are looking for the element to contain

```javascript
const buttonContainingYes = await context.find("button", "Yes");
```

With Appium testing Android, using UIAutomator2, Flagpole parses the selector strategy and text to use `-android uiautomator` under the hood. This allows for finding an element by selector and text. Anything passed into the path parameter that is not a valid selector strategy/value pair will search by text only.

With Appium testing Android, using Espresso, Flagpole simply searches for an element by text, regardless of what you pass into the selector argument.

With Appium testing iOS, Flagpole uses the `-ios predicate string` selector strategy and only searches by text. Searching by selector and text is not supported by Appium on iOS.

With the optional `opts` argument, you can specify `offset` as previously documented. You can also set where Flagpole should look for the matching text with the `findBy` property. The default is "text", which will use the text node value inside of the element. But you can also use "value" to seach in the value or "alt" to search in the alt attribute.

```javascript
const buttonWithYesValue = await context.find("button", "Yes", {
  findBy: "value",
});
```

Please note that findBy is not supported in Appium testing.

#### find(selector: string, matches: RegExp, opts?: FindOpts): Promise\<Value\>

Similar to the previous overload of `find`, we can also search the contents of the element for one that matches a regular expression. This gives us greater control over how exactly it should match, such as matching capitalization and spacing.

```javascript
const buttonContainingYes = await context.find("button", /yes/i);
```

So if you want it to match EXACTLY "Yes", including a capital "Y" and no spaces on either side, you could do this:

```javascript
const buttonExactlyYes = await context.find("button", /^Yes$/);
```

RegEx is not supported in Appium testing.

#### find(selectors: string[]): Promise\<Value\>

With any of the above variations, selector can also be an array of strings. This will cause `find` to look for the first instance of ANY of those selector paths.

```javascript
const firstButtonLikeThing = await context.find(["button", ".button"]);
```

This is not supported in Appium testing.

### findAll(): Promise\<Value[]\>

Select the elements or values at the given path. What this actually does varies by the type of scenario.

This always returns an array. It will be an empty array if nothing matched. The array elements themselves will be the same object types that you'd have gotten from `.find()`.

#### findAll(selector: string, opts?: FindAllOpts): Promise\<Value[]\>

The first argument is always the selector. It is the only required argument.

```javascript
const articles = await context.findAll("section.topStories article");
```

Appium:

```javascript
const textViews = await context.findAll("class name/android.widget.TextView");
```

You can pass an optional `opts` argument. In the simple form of `findAll` this allows you to set two things:

- `offset` = Zero-based index of where to start in the return array. Use this if you want to skip the first matching element, for example.
- `limit` = If you don't want to return all matching elements, this will limit the amount in the returned array.

So, for example, this would attempt to get the third through seventh articles:

```javascript
const articles = await context.findAll("section.headlines article", {
  offset: 2,
  limit: 5,
});
```

#### findAll(selector: string, contains: string, opts?: FindAllOpts): Promise\<Value[]\>

This overload will allow you to search for only elements that match the selector AND have the contains string in the text node.

```javascript
const articles = await context.findAll("section.headlines article", "breaking");
```

The optional `opts` argument allows you to use `offset`, `limit` and `findBy` (which works just like in the `find()` method).

With Appium, this works the same way as the find by selector and text overload does in the `find()` method, with the addition of the `offset` and `limit` fields in the `opts` argument.

#### findAll(selector: string, matches: RegExp, opts?: FindAllOpts): Promise\<Value[]\>

This works like the `contains` string, except you can use a regular expression for more exacting matches.

```javascript
const itemsContainingTupac = await context.findAll("li", /tupac/i);
```

This is not supported when Appium testing.

#### findAll(selectors: string[]): Promise\<Value[]\>

With any of the above variations of `findAll`, the first argument can also be an array of strings. If you pass in more than one, the resulting response will include any items that match any of those selectors.

```javascript
const allButtonLikeThings = await context.findAll(["button", ".button"]);
```

This is not supported with Appium testing.

### findAllXPath(xPath: string): Promise\<DOMElement[]\>

Checks for any and all elements at XPath of `xPath`. Usually a CSS selector is preferable, but sometimes XPath is more powerful. This only works with Puppetteer tests currently.

```javascript
const links = await context.findAllXpath("//a");
```

### findXPath(xPath: string): Promise\<DOMElement\>

Checks for an element to exist with XPath of `xPath`. Usually a CSS selector is preferable, but sometimes XPath is more powerful. This only works with Puppeteer test currently.

```javascript
const title = await context.findXpath("/main/h1[1]/span");
```

### gesture(type: GestureType, opts: GestureOpts): Promise\<Response\>

Executes a gesture onscreen. Currently, pinch and stretch gestures are supported.

```javascript
const res = await context.gesture("stretch", {
  start: [500, 500],
  amount: [200, 200],
  duration?: 500
});
```

`start` is the XY coordinate near to where each pointer will start. One pointer will start -10 square pixels away, the other +10 square pixels away.
`amount` is the number of pixels the pointers will move on each axis. The pointers move in opposite directions.
`duration` is how long the execution of the gesture takes.

Please note that `start` and `amount` are required when gesturing on the screen itself, rather than on an element.

### get(aliasName: string): any

If a value was previously saved on this Scenario `set` or within an Assertion, Value or DOMElement with `as` then use this `get` method to retrieve it.

```javascript
scenario
  .next((context) => {
    context
      .assert(await context.find("title"))
      .as("t")
      .length.greaterThan(0);
  })
  .next((context) => {
    context.assert(await context.get("t").getInnerText()).equals("Google");
  });
```

### getScreenProperties(): Promise\<ScreenProperties\>

Get properties of screen of device under tests. Currently only works with Appium. Returns angle, dimensions, and rotation.

```javascript
const screenProperties = await context.getScreenProperties();
```

### getSource(): ValuePromise

Get HTML or XML representation of current page or viewport.
Currently only works to get XML of Appium viewport.

```javascript
const source = await context.getSource();
```

### hideKeyboard(): Promise\<void\>

Hide onscreen keyboard. Currently only works in Appium scenarios. Does not work on iOS unless the keyboard on the device under test has a dedicated dismiss button.

```typescript
await context.hideKeyboard();
```

### movePointer(...pointers: PointerMove[]): Promise\<Response\>

Move pointer on screen. Can be used for touches, gestures, pinching, zooming, rotating, dragging, etc.

```typescript
const res = await context.movePointer(
  {
    start: [500, 500],
    end: [700, 700],
    type: "default" | "mouse" | "pen" | "touch",
    duration: 500,
    disposition: {
      start: "down",
      end: "up",
    },
  },
  {
    start: [600, 600],
    end: [800, 800],
    type: "default" | "mouse" | "pen" | "touch",
    duration: 500,
    disposition: {
      start: "down",
      end: "up",
    },
  }
);
```

Pass one object per pointer device. Actions will be executed simultaneously for each pointer device.
`start` is the XY coordinate for the beginning of the action.
`end` is the XY coordinate where the pointer will move.
`type` is the type of pointer device simulated.
`duration` is how long each action takes to complete.
`disposition` is whether the pointer will start or end up or down. Up means the screen is not being touched, down means the screen is being touched.

### openInBrowser(): Promise\<string\>

Saves the response body to a temporary file and opens it in a browser. This is really only for debugging. The promise resolves to the string of the temporary file.

```javascript
await context.openInBrowser();
```

### pause(milleseconds: number): Promise\<void\>

Delay the execution by this much.

```javascript
await context.pause(1000);
```

### rotate(rotation: string | number): Promise\<string | number\>

Rotate the screen by either degrees or screen orientation, such as landscape or portrait. Currently only works with Appium, using strings "PORTRAIT" or "LANDSCAPE".

```javascript
let rotation = await context.rotate("LANDSCAPE");
```

```javascript
let rotation = await context.rotate(90);
```

### screenshot(): Promise\<Buffer\>

Takes a screenshot of that point in time. Currently this is only supported in a browser-based or an Appium scenario. The return value is a promise that resolves with a Buffer of the image bytes.

```typescript
const screenshot = await context.screenshot();
```

If you want to save the screenshot to a local file, pass the file path in as the first argument.

```typescript
await context.screenshot("capture.png");
```

There are also some options that can optionally be passed in like. For example:

```typescript
const screenshot = await context.screenshot({
  path: "/path/to/local/file.png", // To save to a local file
  fullPage: true, // Takes screenshot of entire page, not just the current viewport
  clip: { x: 100, y, 200, width: 50, height: 50 } // Crop screenshot to this region
  omitBackground: true // Ignores the background image or color to return a transparent PNG background
});
```

You can also combine the two arguments. In this case, the first argument of the local file path would override a `path` property in the `opts` second argument.

Please note that the fullPage and omitBackground properties are not supported with Appium screenshots.

```typescript
const screenshot = await context.screenshot("/path/to/local/file.png", {
  fullPage: true,
});
```

### scrollTo({ x?: number, y?: number }): Promise\<void\>

For browser-based tests this will scroll to these coordinates on the page body. Both `x` and `y` properties are optional and will be assumed as `0` if not set.

```javascript
await context.scrollTo({ y: 500 });
```

### selectOption(selector: string, value: string | string[]): Promise\<string[]\>

Select items in a dropdown or multi-select box.

```javascript
await context.selectOption('select[name="favoriteSport"]', "Track & Field");
```

### set(aliasName: string, value: any): AssertionContext

Save `value` to alias `aliasName` so it that it can be retrieved later with a `.get(aliasName)` call.

### submit(selector: string, ...): Promise\<Scenario | void\>

Submits the form, if the selected element is a form. This works on both browser and html types. For browser, it will do whatever submitting the form would do in the browser window. For html scenarios, it will serialize the form input and then submit it, navigating to the next page.

Other than that, it works mostly the same as a `click()`.

### type(path: string, textToType: string, opts: any): Promise\<void\>

Type this text into the selected path. For browser scenarios this will be emulating literally typing into the browser. For HTML scenarios it set the value of that element.

```javascript
await context.type('input[name="q"]', "who shot 2pac?");
```

### waitForReady(timeout: number = 10000): Promise\<void\>

Wait for `timeout` milliseconds for the browser's navigation to complete. This really only makes sense in a browser-based scenario. This is shorthand for the `domcontentloaded` in the Puppeteer API.

```javascript
await context.waitForReady();
```

### waitForExists(path: string, timeout: number): Promise\<DOMElement\>

Test if an element exists at that path. For a browser or an Appium scenario it will wait a certain timeout (default 30000ms) for the element to show up. If you want to change it, set the timeout value in the second argument.

```javascript
const button = await context.waitForExists("a.submit", 2000);
```

### waitForHavingText(path: string, text, timeout?: number): Promise\<DOMElement\>

Checks for an element to exist at `path` CSS selector, which also contains the string `text` inside of its `innerText`. By default it will wait for 30000ms for the element, you can change the timeout with the third argument.

```javascript
await context.waitForHavingText("h1", "Features", 2000);
```

### waitForHidden(path: string): Promise\<DOMElement\>

Checks if an element at this selector is hidden (display none or visibility hidden). This only makes sense for browser or Appium tests, it will error for other types of scenario. By default it will wait for 30000ms for the element to show up, you can change the timeout with the second argument.

```javascript
const button = await context.waitForHidden('button[type="submit"]', 2000);
```

### waitForLoad(timeout: number = 10000): Promise\<void\>

Wait for `timeout` milliseconds for the browser's navigation to complete. This really only makes sense in a browser-based scenario. This is shorthand for the `load` in the Puppeteer API.

```javascript
await context.waitForLoad(15000);
```

### waitForNetworkIdle(timeout: number = 10000): Promise\<void\>

Wait for `timeout` milliseconds for the browser's navigation to complete. This really only makes sense in a browser-based scenario. This is shorthand for the `networkidle0` in the Puppeteer API.

```javascript
await context.waitForNetworkIdle(5000);
```

### waitForNavigation(timeout: number = 10000, waitFor?: string | string[]): Promise\<void\>

Wait for `timeout` milliseconds for the browser's navigation to complete. This really only makes sense in a browser-based scenario.

Default waitFor value is `networkidle2`, as defined in the Puppeteer API.

```javascript
await context.click("a.topStory");
await context.waitForNavigation();
await context.exists("h1.headline");
```

### waitForVisible(path: string): Promise\<DOMElement\>

Checks if an element at this selector is visible. This only makes sense for browser or Appium tests, it will error for other types of scenario. By default it will wait for 30000ms for the element to show up, you can change the timeout with the second argument.

```javascript
const button = await context.waitForVisible('button[type="submit"]', 2000);
```

### waitForXpath(xPath: string, timeout?: number): Promise\<DOMElement\>

Checks for an element to exist with XPath of `path`. Usually a CSS selector is preferable, but sometimes XPath is more powerful. By default it will wait for 30000ms for the element, you can change the timeout with the second argument.

Also works with Appium scenarios.

```javascript
await context.waitForXpath("/main/h1[1]/span", 2000);
```
