# AssertionContext

This is the context that each set of next callbacks within a Scenario operate with as the "this" value. It gives you all the handy methods and properties that you need.

## Methods

### assert(value: any): Assertion

Creates an assertion with the input value.

```javascript
this.assert(await this.select('article.topStory h1'))
```

### clear(selector: string): Promise<void>

Clear the existing text in this input and then type this text into the selected path. 

```javascript
await this.clear('input[name="q"]');
```

### clearThenType(path: string, textToType: string, opts: any): Promise<void>

Clear the existing text in this input and then type this text into the selected path. For browser scenarios this will be emulating literally pressing keys into the browser. For HTML scenarios it overwrite the value of that element.

```javascript
await this.clearThenType('input[name="q"]', 'who shot 2pac?');
```

### click(path: string): Promise<void | Scenario>

Issues a click on the selected element. This works on both browser and html types. For browser, the click event will be passed through to the underlying browser. For html scenarios, it will navigate a link or submit a form, if you click on a submit button or a link.

```javascript
await this.click('input[name="q"]');
```

For html types, the promise will return a new dynamic scenario that will load the resulting page navigation.

```
(await this.click('a.login')).next(fuction() {
  this.assert(response.statusCode.equals(200);
});
```

### comment(message: string)

Add a comment to the Scenario output.

### evaluate(callback: Function): Promise<any>

Passes this function off to the underlying response to run it in the context of that type. 

For example, if this is a browser type the callback will be handed off to Puppeteer and actually run within the browser. Like this...

```javascript
const url = await this.evaluate(() => {
  return window.location.href;
});
```

As you can see, you can not only execute the code in that browser's context, but you can reach in and return values from it.

If this is a Cheerio html type scenario, you can execute against the raw Cheerio jQuery-like DOM parser.

```javascript
const loginText = await this.evaluate(($) => {
  return $('a.login').first('span').text();
});
```

For a REST API response this is less useful perhaps, but you are passed the JSON response to do something with like this.

```javascript
const loginText = await this.evaluate((json) => {
  return json.meta.totalResults;
});
```

In theory, with any of these types, you could also manipulate the response with this method.

### pause(milleseconds: number): Promise<void>

Delay the execution by this much

```javascript
await this.pause(1000);
```

### find(path: string): Promise<DOMElement | CSSRule | Value | null>

Select the element or value at the given path. What this actually does varies by the type of scenario. 

Browser and Html tests both return DOMElement. Stylesheet requests return CSSRule and JSON/REST scenarios return a Value.

Note it returns only one element. If multiple match the path then it returns the first. If none match then it returns null.

```javascript
const firstArticle = await this.select('section.topStories article');
```

### findAll(path: string): Promise<DOMElement[] | CSSRule[] | Value[] || []>

Select the elements or values at the given path. What this actually does varies by the type of scenario. Browser and Html tests both return DOMElement. Stylesheet requests return CSSRule and JSON/REST scenarios return a Value.

This always returns an array. It will be an empty array if nothing matched. The array elements themselves will be the same object types that you'd have gotten from .select(path).

```javascript
const articles = await this.selectAll('section.topStories article');
```

### submit(path: string): Promise<void | Scenario>

Submits the form, if the selected element is a form. This works on both browser and html types. For browser, it will do whatever submitting the form would do in the browser window. For html scenarios, it will serialize the form input and then submit it, navigating to the next page.

```javascript
await this.click('input[name="q"]');
```

For html types, the promise will return a new dynamic scenario that will load the resulting page navigation.

```
(await this.submit('form.search')).next(fuction() {
  this.assert(response.statusCode.equals(200);
});
```

### type(path: string, textToType: string, opts: any): Promise<void>

Type this text into the selected path. For browser scenarios this will be emulating literally typing into the browser. For HTML scenarios it set the value of that element.

```javascript
await this.type('input[name="q"]', 'who shot 2pac?');
```

### waitForExists(path: string, timeout: number): Promise<DOMElement>

Test if an element exists at that path. For a browser scenario it will wait a certain timeout (default 100ms) for the element to show up. If you want it to wait longer, set the timeout value in the second argument.

```javascript
const button = await this.waitForExists('a.submit', 2000);
```

### waitFoHidden(path: string): Promise<DOMElement>

Checks if an element at this selector is hidden (display none or visibility hidden). This only makes sense for browser tests, it will error for other types of scenario. By default it will wait for 100ms for the element to show up, you can change the timeout with the second argument.

```javascript
const button = await this.waitFoHidden('button[type="submit"]', 2000);
```

### waitForVisible(path: string): Promise<DOMElement>

Checks if an element at this selector is visible. This only makes sense for browser tests, it will error for other types of scenario. By default it will wait for 100ms for the element to show up, you can change the timeout with the second argument.

```javascript
const button = await this.waitForVisible('button[type="submit"]', 2000);
```

## Properties 

### browser: Browser | null

The Browser object that we can use the interact with Pupetter or null if this is not a browser type Scenario.

### page: Puppeteer.Page | null

The Page object from the Puppeteer browser instance. This will be null if not a browser scenario or for some reason Puppeteer fails to load it. You can use this to interact directly with Puppeteer (see the Puppeteer API for that) it is very useful for things that Flagpole does not directly implement through sugar syntax wrappers.

### response: iResponse

The response from the request. This will vary based on the type of Scenario, but some underlying properties are constant in the interface. 

This is often used to pull something like the load time, HTTP Status, headers, mime type, raw response body, etc.

### result: any

If you chain multiple next callbacks together in a Scenario, you can return a value from one and then pull it into the following. To do this you will use this.result to grab that previously returned value. You may find that it is wrapped in a promise and then do await this.result to handle that.

```
.next(await function() {
  const articles = this.selectAll('article');
  this.assert(articles.length).greaterThan(0);
  return articles;
})
.next(await function() {
  const articles = await this.result;
  this.comment(await articles[0].getAttribute('id'));
})
```

### scenario: Scenario

A reference to the calling Scenario.

### suite: Suite

The parent Suite of this Scenario.