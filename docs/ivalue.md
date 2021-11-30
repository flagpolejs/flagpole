# iValue

This is an interface that covers most things that you select within Flagpole. It (and the classes that implement it) is a wrapper of the actual underlying value that lets you do some nice things.

The main purpose of the Value object as a wrapper, rather than just dealing with the underlying data itself, is that Value has a name property, along with other contextual properties of what it is and how it was selected. This is what allows Flagpole to devine intelligent assertion messages and other types of messages when you have not explicitly set one. Some other nice methods are also thrown in as a value add.

This can create confusion for new Flagpole users who think they're dealing with the actual data the Value object contains, rather than a wrapper.

If you want to get the literal interal data that it wraps, you will use the `$` property as a shorthand, which you will find useful as you go.

```typescript
const numberOfImages: Value = (await context.findAll("img")).length;
context.comment(`There are ${numberOfImages.$} images on the page`);
```

## Properties

### \$: any (readonly)

This is a quick way to get the underlying input value within this wrapper object.

```javascript
const firstDataItem = context.response.jsonBody.$.data[0];
```

### array: iValue (readonly)

Returns a new iValue, identical to this one but whose input value is an array.

### bool: iValue (readonly)

Returns a new iValue, identical to this one but whose input value is an boolean. It will take the current iValue's input and evaluate if it is truthy.

### first: iValue (readonly)

Gets the first item from this array or object and returns it as a new iValue.

### float: iValue (readonly)

Returns a new iValue, identical to this one but whose input value is a float.

### keys: iValue (readonly)

Maps the value to an array of its keys if an object or an array.

### int: iValue (readonly)

Returns a new iValue, identical to this one but whose input value is an integer.

### is: iAssertionIs (readonly)

Returns an "Is-Assertion" that can be a great way to make powerful and readable assertions. Many is-assertions use the validator library internally.

```javascript
data.item("dateStart").is.date().and.is.sameOrBeforeDate(data.item("dateEnd"));
```

### json: iValue (readonly)

Returns a new iValue, identical to this one but whose input value is an object by parsing the string contents of this current element with `JSON.parse()`.

```javascript
context.response.body.json.echo();
```

### last: iValue (readonly)

Gets the last item from this array or object and returns it as a new iValue.

### length: iValue (readonly)

Get a new Value object, containing the length of the input value. This could be the number of characters in a string-like value or the number of elements if it's an array.

In this case the input value the iValue resulting from `context.find` will be an array. So `.length` gives us an iValue with the number of items in the array.

```javascript
const images = await context.findAll("img");
const numberOfImages = images.length;
```

In other cases, the input value might be a string. Then the `.length` would be an iValue containing the number of characters.

```javascript
const title = await context.find("title");
const text = await title.getInnerText();
context.assert(text.length).greaterThan(0);
```

### lowercase: iValue (readonly)

Makes the value an lowercase string.

### mid: iValue (readonly)

Gets the middle item from this array or object and returns it as a new iValue.

### name: string (readonly)

Get a friendly name for this Value, which may be something like the selector if it's an element or something similar that is hopefully human readable. This is mainly used when you do not provide specific assertion messages so that Flagpole can create meaningful default messages.

You probably won't use this directly, but if you did it will give you a string representation of a calculated name for this item.

```javascript
const title = await context.find("title");
context.comment('Flagpole calls title: ${title.name}`);
```

### random: iValue (readonly)

Gets a random item from this array or object and returns it as a new iValue.

### string: iValue (readonly)

Returns a new iValue, identical to this one but whose input value is a string.

### uppercase: iValue (readonly)

Makes the value an uppercase string.

### values: iValue (readonly)

Maps the iValue to an array of its values if an object.

## Methods

### as(aliasName: string): Value

Save this value to an alias within the Scenario, so that it can be accessed later.

### asc(key?: string): Value

Sorts the input array or object values in ascending order. This can apply for numeric or string input.

With no argument, it will sort the items themselves.

```javascript
const sortedPrices = prices.asc();
```

With an argument for key, it will sort as an array of objects by that field.

```javascript
const sortedUsStates = usStates.asc("name");
```

### assert(message?: string): Assertion

Make an assertion against this iValue with an optional assertion message.

```javascript
context.response.statusCode.assert("HTTP Status is 200").equals(200);
```

### avg(key?: string): iValue;

Loop through the array or object items and take the average value.

With no argument passed in, it is attempting to average the items in the array.

```javascript
const averagePrice = prices.avg();
```

If the input is an array of objects, the argument then should be the key of the field you want to sum up.

```javascript
const averagePrice = rows.sum("price");
```

### clear(): Promise\<void\>

Clear any text input into this form. This will not have any effect if the element is not a form text input.

```javascript
const textBox = await context.find('input[name="title"]');
await textBox.clear();
```

This also works on Appium elements.

### clearThenType(textToType: string, opts: any): Promise\<void\>

Literally calls clear() and then type() methods. So just a shorthand to clear out the exiting text first before typing.

This also works on Appium elements.

### click(): Promise\<void\>

If the DOM Element is something clickable like a link or a button, you can perform a "click" on it. There are multiple options for overloading it.

Note that Appium does not support overloading `click()`

#### click(message: string, callback: function): Promise\<void\>

You can specify a message, which will become the sub-scenario title, and a callback. This will effectively create a new lambda scenario.

```javascript
const loginLink = await context.find("a.login");
loginLink.click("Make sure link is valid", (subContext) => {
  subContext.assert(subContext.response.statusCode).equals(200);
});
```

#### click(callback: function): Promise\<void\>

If you leave off the message it still works. This will set the sub-scenario title to the URL you are opening.

```javascript
const loginLink = await context.find("a.login");
loginLink.click((subContext) => {
  subContext.assert(subContext.response.statusCode).equals(200);
});
```

#### click(otherScenario: Scenario): Promise\<void\>

Alternately, you can pre-define another scenario you want to execute on this click. Just leave the `open` method off of that scenario definition. Calling click on this link will call open with this URL to kick off that other scenario.

```javascript
const loginLink = await context.find("a.login");
loginLink.click(otherScenario);
```

#### click(): Promise\<void\>

Finally, you can leave off all of the arguments. This will execute a click with a basic scenario, which sometimes will be sufficient for a basic test of a valid link.

```javascript
const loginLink = await context.find("a.login");
loginLink.click();
```

In the case of a browser test, you can use this to execute the click inline with this same scenario (not launch a sub-scenario). In this case, you should await the response. You'd probably also want to `waitForNavigation` or similar wait method after it.

```javascript
const loginLink = await context.find("a.login");
await loginLink.click();
await context.waitForNavigation();
```

### col(key: string | string[]): iValue;

Loops through the input array of objects and returns an iValue containing the array of just that column.

```javascript
const prices = lineItems.col("price");
```

If you pass in an array of strings, the resulting array will be an array of arrays with those columns.

```javascript
const quantitiesAndPrices = lineItems.col(["quantity", "price"]);
```

### count(key?: string): iValue;

Loop through the array or object items and count the number of items.

With no argument passed in, it just counts the number of items. It's not really different than using the `length` property.

```javascript
const itemCount = lineItems.count();
```

If the input is an array of objects, it is counting the number of items where that property is truthy.

```javascript
const inStockItemCount = inventory.count("inStock");
```

### desc(key?: string): Value

Sorts the input array or object values in descending order. This can apply for numeric or string input.

With no argument, it will sort the items themselves.

```javascript
const pricesHighToLow = prices.desc();
```

With an argument for key, it will sort as an array of objects by that field.

```javascript
const reverseAlphaUsStates = usStates.desc("name");
```

### doubleTap(ms?: number): Promise\<string | null\>;

Does a double tap on an element. You can set the delay between taps, which defaults to 10 milliseconds.

### download(): Promise\<string | Buffer | null\>

This will download the URL that is referenced by this element. It will automatically pull the `src` attribute from an `img` tag, for example. Or extract the `href` from a link.

When called without any arguments, it will use the default and return the response as a Buffer;

```typescript
const cssContent = await cssLinkElement.download();
```

If you want to save it to a local file, pass that path as the first argument.

```typescript
await cssLinkElement.download("./localFile.css");
```

If you want to pass in opts for the HTTP request. This will use the `request-promise` library, so any valid opts for this library will work.

```typescript
const cssContent = await cssLink.download({
  qs: {
    cacheBuster: Date.now(),
  },
});
```

You can also pass in both `localFilePath` and `opts` arguments.

```typescript
await cssLink.download("./localFile.css", {
  qs: {
    cacheBuster: Date.now(),
  },
});
```

For all cases above, Flagpole will return a Promise with a Buffer response unless the download fails. In that case the promise will resolve with a null.

If you want the response to be in text instead of the raw bytes of the Buffer, you must set the encoding value in the opts argument. Here are some examples:

```typescript
const download1 = await cssLink.download({
  encoding: "base64",
});
const download2 = await cssLink.download("./localFile.css", {
  encoding: "utf8",
  headers: { foo: "bar" },
});
```

### each(callback: (val) => void): iValue;

Loop through the array or object items.

```javascript
rows.each((row, i) => {
  context.assert(`Row #${i} is active`, row.isActive).equals(true);
});
```

### echo(): iValue

This will convert the input to a string and write it out as a scenario comment. It is a shorthand for using the `context.comment` method to do the same thing.

With no arguments, it is just echos out the string value:

```javascript
lineItems.length.echo();
```

It can also take a function as an argument so that you can formulate it into a human-readable string.

```javascript
lineItems.length.echo((n) => `There are ${n} line items`);
```

### every(callback: (val) => boolean): iValue;

Loop through the array or object items and make sure all return true.

```javascript
const allAreActive = rows.every((row) => row.isActive);
```

### exists(): Promise\<iValue\>

#### exists(): Promise\<iValue\>;

With no arguments, you are making an assertion that this element exists. That is, it is not `null` or `undefined`. An assertion message is automatically generated based on the original selector.

```javascript
const h1 = await context.find("h1");
await h1.exists();
```

Note that using exists in this manner is not supported in Appium testing.

#### exists(message: string): Promise\<iValue\>;

You can alternately specify a custom asertion message:

```javascript
const h1 = await context.find("h1");
await h1.exists("There should be an H1 tag");
```

To be clear, this would not be any different than the shorter:

```javascript
const h1 = await context.exists("There should be an H1 tag", "h1");
```

But there may be situations where you already have an element from another type of method and want to make sure it exists.

### fillForm(): Promise\<Value\>

#### fillForm(data: { [key: string]: any }): Promise\<Value\>

Fill out a form element with this data. The data object should match the input/select name attributes of elements within the form. For multi-select inputs pass in an array of values to be checked.

If this element is not a form, the method will error.

```javascript
const form = await context.find("form");
await form.fillForm({
  firstName: "Charlie",
  lastName: "Ward",
  position: "QB",
  team: "FSU",
});
```

#### fillForm(attributeName: string, data: { [key: string]: any }): Promise\<Value\>

This works just like the single-argument overload, except that you can specify the attribute name. The default is to search in the `name` attribute, but in some cases you may want to use a different field such as `id` or `ng-reflect-name` or antyhing else.

```javascript
const form = await context.find("form");
await form.fillForm("ng-relect-name", {
  userName: "foo",
  password: "bar",
});
```

### filter(callback: (val) => boolean): iValue;

Loop through the array or object items and filter the input;

```javascript
const activeRows = rows.filter((row) => row.isActive);
```

### find(selector: string): Promise\<iValue\>

Find the first element in the descendents of the current element that matches this selector. If there are no matches, you will be returned a Value object that contains null.

```javascript
const li = await someElement.find("li");
```

There are additional overloads for this method. For more details see the documentation in `AssertionContext` because it works the same way.

Note that find does not work in this manner on Appium elements.

### findAll(selector: string): Promise\<iValue\>

Find all of the elements in the descendents of the current element that match this selector. If there are no matches, it will be an empty array.

```javascript
const li = await someElement.findAll("li");
```

There are additional overloads for this method. For more details see the documentation in `AssertionContext` because it works the same way.

Note that findAll does not work in this manner on Appium elements.

### focus(): Promise\<any\>;

Give this element focus.

### getAttribute(key: string): Promise\<Value\>

Get the attribute of the element with this key and return its value. If it is not present the Value object will contain null.

```javascript
const src = await img.getAttribute("src");
```

This also works with Appium testing. Valid attributes for Appium elements are:
checkable, checked, class, className, clickable, content-desc, contentDescription, enabled, focusable, focused, long-clickable, longClickable, package, password, resource-id, resourceId, scrollable, selection-start, selection-end, selected, text, name, bounds, displayed, contentSize

### getBounds(boxType: string): Promise\<iBounds | null\>;

Get the bounds of this DOM or Appium Element.

### getChildren(selector?: string): Promise\<DOMElement[]\>

Get the immediate children of the current element. If a selector string is passed, it will filter only children matching that selector. If none match the selector, an empty array will be returned.

```javascript
const children = await someElement.getChildren("li");
```

### getClassName(): Promise\<Value\>

Get the class name of this element. If there are multiple classes then they will be space delimited.

```javascript
const className = await someElement.getClassName();
```

### getInnerHtml(): Promise\<Value\>

Get the child HTML tags that are between the opening and closing tag of this element.

```javascript
const html = await someElement.getInnerHtml();
```

### getInnerText(): Promise\<Value\>

Get the text inside the opening and closing tags of the given element.

```javascript
const text = await someElement.getInnerText();
```

### getNextSibling(selector?: string): Promise\<DOMElement | Value\<null\>\>

Traverse through the siblings proceeding the current element. If no selector is passed, the immediate following sibling is returned. If a selector is passed, the next one matching the selector is returned. If none match, a Value object containing null is returned.

```javascript
const nextSibling = await someElement.getNextSibling("li");
```

### getNextSiblings(selector?: string): Promise\<DOMElement[]\>

Traverse through the siblings proceeding the current element. If no selector is passed, all next siblings will be returned. If a selector is passed, only those matching the selector. If none match, an empty array is returned.

```javascript
const siblings = await someElement.getNextSiblings("li");
```

### getOuterHtml(): Promise\<Value\>

Get the HTML string of the current element and all of its child elemenets from the opening of the tag to the ending of the tag.

```javascript
const html = await someElement.getOuterHtml();
```

### getPreviousSibling(selector?: string): Promise\<DOMElement | Value\<null\>\>

Traverse through the siblings preceeding the current element. If no selector is passed, the immediate preceeding sibling is returned. If a selector is passed, the previous one matching the selector is returned. If none match, a Value object containing null is returned.

```javascript
const prevSibling = await someElement.getPreviousSibling("li");
```

### getPreviousSiblings(selector?: string): Promise\<DOMElement[]\>

Traverse through the siblings preceeding the current element. If no selector is passed, all previous siblings will be returned. If a selector is passed, only those matching the selector. If none match, an empty array is returned.

```javascript
const siblings = await someElement.getPreviousSiblings("li");
```

### getProperty(key: string): Promise\<Value\>

Get the property of this input value with the key. If there is no such property then it will return null. This is an async method. In Appium tests, this gets the chosen CSS property of the element, which is only possible in a Webview context.

```javascript
const isChecked = await element.getProperty("checked");
```

### getSiblings(selector?: string): Promise\<DOMElement[]\>

Get the siblings of the current element. If a selector string is passed, it will filter only siblings matching that selector. If none match, it will return an empty array.

```javascript
const siblings = await someElement.getSiblings("li");
```

### getTagName(): Promise\<Value\>

Get the HTML tag of this element.

```javascript
const tagName = await someElement.getTagName();
```

Also works to get tag names of Appium elements, depending on the automation driver.

### getText(): Promise\<Value\>

Get the textContent of this element. This is slightly different from getInnerText() and here is a [StackOverflow question](https://stackoverflow.com/questions/35213147/difference-between-textcontent-vs-innertext) about that so I don't have to repeat it.

```javascript
const text = await div.getText();
```

This also works on Appium elements.

### getValue(): Promise\<Value\>

Get the value of this element. This is normally used with form elements.

```javascript
const searchTerm = await input.getValue();
```

### groupBy(key: string): Value

Loops through the input array of objects and returns a new iValue with an object with a property for each distinct value in that field, each with a value that is an array of the items that had that value.

```javascript
const eventsByCountry = events.groupBy("venueCountry");
```

### hasAttribute(key: string): Promise\<Value\>

Does this element have an attribute by this name?

```javascript
context.assert(await img.hasAttribute("src")).equals(true);
```

### hasClassName(className: string): Promise\<Value\>

Does this element have the given class? The value will contain boolean.

```javascript
context.assert(await element.hasClassName("heading")).equals(true);
```

### hasData(key: string): Promise\<Value\>

Does this element have a data property by this name?

```javascript
context.assert(await element.hasData("athlete-id")).equals(true);
```

### hasProperty(key: string): Promise\<Value\>

If this element is an object of some sort, does it have the property matching key? Note this is an async function.

```javascript
context.assert(await element.hasProperty("qa-name")).equals(true);
```

### hover(): Promise\<void\>;

Hover over this element with the virtual mouse.

### isNullOrUndefined(): boolean

Self explanatory.

### isUndefined(): boolean

Self explanatory.

### isNull(): boolean

Is this input value literally null.

### isPromise(): boolean

Self explanatory.

### isArray(): boolean

Self explanatory.

### isCookie(): boolean

Self explanatory.

### isRegularExpression(): boolean

Is the input value a regular expression pattern (RegExp type).

### isNaN(): boolean

Is this input value literally the JavaScript value of NaN.

### isNumber(): boolean

Is this input value of type number? NaN will return false.

### isNumeric(): boolean

Is the input value numeric, even if it is a string or something else for its actual type.

### isObject(): boolean

Self explanatory.

### isString(): boolean

Self explanatory.

### item(selector: string): iValue

This is very similar to find on a JSON scenario, except that it is sychrononous. This allows you to chain it.

```javascript
jsonData.item("meta.count").assert().greaterThan(0);
```

### join(joiner: string): iValue;

Convert the input to a array and join it into a string, return the resulting iValue;

### load(): Promise\<Scenario\>

Load works basically the same way as `.click()`, so you should see the documentation on that.

The difference between the two is that `click` will only work for clickable things like links or buttons. However, you can use `load` on other things like images, audio, video, stylesheets, iframes, and forms.

```javascript
const image = await context.find("img.logo");
image.load("Make sure logo is a valid image");
```

### longPress(ms?: number): Promise\<string | void\>;

Longpress on an element. Holds touch action for 1000 milliseconds by default. This currently only works for Appium elements.

### map(mapper: Function): iValue;

If input is an array, map over each element in the array to transform it. Otherwise, use mapper to transform the input itself. This method returns a new iValue with the transformed input.

With an array:

```javascript
const names = rows.map((row) => row.name);
```

With a string input:

```javascript
const lcName = name.map((str) => str.toLowerCase());
```

### max(key?: string): iValue;

Loop through the array or object items and find the maximum value.

With no argument passed in, it finds the maximum item.

```javascript
const maxPrice = prices.max();
```

If the input is an array of objects, it will look for the max value in that field.

```javascript
const maxPrice = lineItems.max("price");
```

### median(key?: string): iValue;

Loop through the array or object items and take the median value.

With no argument passed in, it is attempting to grab the median of the items in the array.

```javascript
const medianPrice = prices.median();
```

If the input is an array of objects, the argument then should be the key of the field you want to get the median from.

```javascript
const medianPrice = rows.median("price");
```

### min(key?: string): iValue;

Loop through the array or object items and find the minimum value.

With no argument passed in, it finds the minimum item.

```javascript
const minPrice = prices.min();
```

If the input is an array of objects, it will look for the min value in that field.

```javascript
const minPrice = lineItems.min("price");
```

### none(callback: (val) => boolean): iValue;

Loop through the array or object items and make sure none return true.

```javascript
const noneAreActive = rows.none((row) => row.isActive);
```

### nth(index: number): iValue;

Get the `n`th value in the array or object.

```javascript
const fourthItem = array.nth(3);
```

### pluck(property: string): iValue;

When the Value contains an array of objects, this method will "pluck" the value of that property from each item in the array. It returns an iValue containing that array of values.

```javascript
const ids = array.pluck("id");
```

Pracical example:

```javascript
array
  .pluck("name")
  .assert("Every name is a string")
  .every((name) => typeof name === "string");
```

### press(key: string, opts?: any): Promise\<void\>;

Press these keys on the keyboard.

### reduce(callback: (val) => any, initial: any): iValue;

Loop through the array or object items with reduce. Returns the final result.

```javascript
const totalPrice = rows.every((t, row) => t + row.quantity * row.unitPrice, 0);
```

### screenshot(): Promise\<Buffer\>

This is currently only supported with browser and Appium type scenarios. See documentation for `context.screenshot()` because the arguments are the same. The only difference is calling it on an Element will grab the image just of this element.

### scrollTo(): Promise\<void\>;

For browser-based scenarios, scroll this element into view.

```javascript
const emailField = await context.exists("input[name='email']");
await emailField.scrollTo();
```

### some(callback: (val) => boolean): iValue;

Loop through the array or object items and see if any return true.

```javascript
const anyAreActive = rows.some((row) => row.isActive);
```

### split(splitter: string | RegExp): iValue;

Convert the input to a string and split it into an array, return the resulting iValue;

### submit(): Promise\<Scenario\>

Load works basically the same way as `.click()` and `.load()`, so you can reference the documentation on those.

The difference is that `submit` only works on form elements _and_ it will compile the filled out data from the form. Then it will submit the form based on the settings of the `method` and `action` attributes of the form element.

```javascript
const form = await context.find("form.login");
await form.fillForm({
  user: "bob",
  password: "abc123",
});
await form.submit();
await context.waitForNavigation();
```

### sum(key?: string): iValue;

Loop through the array or object items and sum up the total value.

With no argument passed in, it is attempting to sum each item in the array.

```javascript
const totalCount = quantities.sum();
```

If the input is an array of objects, the argument then should be the key of the field you want to sum up.

```javascript
const totalCount = rows.sum("quantity");
```

### tap(): Promise\<void\>;

Tap the element.

### toArray(): any[]

Converts the input value into an array. If it's not already an array then it just wraps it in an array.

### toFloat(): number

Convert this value to a number with parseFloat.

### toInteger(): number

Convert this value to a number with parseInt.

### toString(): string

Casts the input value as a string.

### toType(): string

Grabs the type of the input value. It will be all lowercase and is a deep type look up, beyond a normal typeof.

### type(textToType: string, opts: any): Promise\<void\>

Type this text into an text input. This will not have any effect if the element is not a form text input.

If there is existing text already in the field it will append to it.

```javascript
const textBox = await context.find('input[name="title"]');
await textBox.type("College Football is Back");
```

The opts is only relevant to browser types, like Puppeteer, it will pass the value on to do things like add delay between keypresses.

```javascript
const textBox = await context.find('input[name="title"]');
await textBox.type("College Football is Back", { delay: 100 });
```

### unique(): Value

Takes the input array of items or object values, removes duplicates, and returns a new iValue with an array of that result of distinct values.

```javascript
const countries = rows.col("venueCountry").unique();
```
