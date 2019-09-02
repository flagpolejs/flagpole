# DOMElement

This is an abstract class for elements that is extended by HTMLElement, PuppeteerElement, and ExtJSComponent. Use it a base reference for all of these. You typically get this element by way of `context.find('css selector path')` from the AssertionContext.

This class is extended more specifically by other classes:

* PuppeteerElement
* BrowserElement
* ExtJsComponent
* HTMLElement

## Methods

### clear(): Promise<void>

Clear any text input into this form. This will not have any effect if the element is not a form text input.

```javascript
const textBox = await context.find('input[name="title"]');
await textBox.clear();
```

### clearThenType(textToType: string, opts: any): Promise<void>

Literally calls clear() and then type() methods. So just a shorthand to clear out the exiting text first before typing.

### fillForm(data: { [key: string]: any }): Promise<Value>

Fill out a form element with this data. The data object should match the input/select name attributes of elements within the form. For multi-select inputs pass in an array of values to be checked.

If this element is not a form, the method will error.

```javascript
const form = await context.find('form');
await form.fillForm({
    firstName: 'Charlie',
    lastName: 'Ward',
    position: 'QB',
    team: 'FSU'
})
```

### find(selector: string): Promise<DOMElement | Value<null>>

Find the first element in the descendents of the current element that matches this selector. If there are no matches, you will be returned a Value object that contains null.

```javascript
const li = await someElement.find('li');
```

### findAll(selector: string): Promise<DOMElement[]>

Find all of the elements in the descendents of the current element that match this selector. If there are no matches, it will be an empty array.

```javascript
const li = await someElement.findAll('li');
```

### getChildren(selector?: string): Promise<DOMElement[]>

Get the immediate children of the current element. If a selector string is passed, it will filter only children matching that selector. If none match the selector, an empty array will be returned.

```javascript
const children = await someElement.getChildren('li');
```

### getClassName(): Promise<Value>

Get the class name of this element. If there are multiple classes then they will be space delimited.

```javascript
const className = await someElement.getClassName();
```

### getClosest(selector: string): Promise<DOMElement | Value<null>>

Going up the chain of ancestors (and including itself), look for the first element matching the selector. If there are no ancestors (or self) that matches, a Value object containing null is returned.

```javascript
const tbody = await td.getClosest('tbody');
```

### getData(key: string): Promise<Value>

Get data property by this key from the current element. Value will contain null if it does not.

```javascript
context.assert(await element.getData('athlete-id')).equals(123);
```

### getInnerHtml(): Promise<Value>

Get the child HTML tags that are between the opening and closing tag of this element.

```javascript
const html = await someElement.getInnerHtml();
```

### getInnerText(): Promise<Value>

Get the text inside the opening and closing tags of the given element.

```javascript
const text = await someElement.getInnerText();
```

### getNextSibling(selector?: string): Promise<DOMElement | Value<null>>

Traverse through the siblings proceeding the current element. If no selector is passed, the immediate following sibling is returned. If a selector is passed, the next one matching the selector is returned. If none match, a Value object containing null is returned.

```javascript
const nextSibling = await someElement.getNextSibling('li');
```

### getNextSiblings(selector?: string): Promise<DOMElement[]>

Traverse through the siblings proceeding the current element. If no selector is passed, all next siblings will be returned. If a selector is passed, only those matching the selector. If none match, an empty array is returned.

```javascript
const siblings = await someElement.getNextSiblings('li');
```

### getOuterHtml(): Promise<Value>

Get the HTML string of the current element and all of its child elemenets from the opening of the tag to the ending of the tag.

```javascript
const html = await someElement.getOuterHtml();
```

### getPreviousSibling(selector?: string): Promise<DOMElement | Value<null>>

Traverse through the siblings preceeding the current element. If no selector is passed, the immediate preceeding sibling is returned. If a selector is passed, the previous one matching the selector is returned. If none match, a Value object containing null is returned.

```javascript
const prevSibling = await someElement.getPreviousSibling('li');
```

### getPreviousSiblings(selector?: string): Promise<DOMElement[]>

Traverse through the siblings preceeding the current element. If no selector is passed, all previous siblings will be returned. If a selector is passed, only those matching the selector. If none match, an empty array is returned.

```javascript
const siblings = await someElement.getPreviousSiblings('li');
```

### getProperty(key: string): Promise<Value>

Get property by this key from the current element. Value will contain null if it does not.

```javascript
context.assert(await input.hasProperty('checked')).equals(true);
```

### getSiblings(selector?: string): Promise<DOMElement[]>

Get the siblings of the current element. If a selector string is passed, it will filter only siblings matching that selector. If none match, it will return an empty array.

```javascript
const siblings = await someElement.getSiblings('li');
```

### getTagName(): Promise<Value>

Get the HTML tag of this element. 

```javascript
const tagName = await someElement.getTagName();
```

### getText(): Promise<Value>

Get the textContent of this element. This is slightly different from getInnerText()  and here is a [StackOverflow question](https://stackoverflow.com/questions/35213147/difference-between-textcontent-vs-innertext) about that so I don't have to repeat it.

```javascript
const text = await div.getText();
```

### getValue(): Promise<Value>

Get the value of this element. This is normally used with form elements.

```javascript
const searchTerm = await input.getValue();
```

### hasAttribute(key: string): Promise<Value>

Does this element have an attribute by this name?

```javascript
context.assert(await img.hasAttribute('src')).equals(true);
```

### hasClassName(className: string): Promise<Value>

Does this element have the given class? The value will contain boolean.

```javascript
context.assert(await element.hasClassName('heading')).equals(true);
```

### hasData(key: string): Promise<Value>

Does this element have a data property by this name?

```javascript
context.assert(await element.hasData('athlete-id')).equals(true);
```

### hasProperty(key: string): Promise<Value>

Does this element have a property by this name?

```javascript
context.assert(await input.hasProperty('readonly')).equals(true);
```

### type(textToType: string, opts: any): Promise<void>

Type this text into an text input. This will not have any effect if the element is not a form text input.

If there is existing text already in the field it will append to it.

```javascript
const textBox = await context.find('input[name="title"]');
await textBox.type('College Football is Back');
```

The opts is only relevant to browser types, like Puppeteer, it will pass the value on to do things like add delay between keypresses.

```javascript
const textBox = await context.find('input[name="title"]');
await textBox.type('College Football is Back', { delay: 100 });
```

## Properties 

### $: any (readonly)

This is a quick way to get the underlying value within this wrapper object. So that will typically be either an ElementHandle if a browser test or a Cheerio object if an html test.

### name: string (readonly)

Get a friendly name for this `DOMElement`, which may be something like the selector if it's an element or something similar that is hopefully human readable. This is mainly used when you do not provide specific assertion messages so that Flagpole can create meaningful default messages.

### path: string (readonly)

The selector requested to query this `DOMElement`.