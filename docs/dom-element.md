# DOMElement

This object contains elements within the DOM for Puppeteer browser scenarios or Cheerio HTML scenarios. You typically get this element by way of `context.find('css selector path')` from the AssertionContext.

This class is extended more specifically by other classes:

* PuppeteerElement
* BrowserElement
* ExtJsComponent

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

### getClassName(): Promise<Value>

Get the class name of this element. If there are multiple classes then they will be space delimited.

```javascript
const className = await someElement.getClassName();
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

### getOuterHtml(): Promise<Value>

Get the HTML string of the current element and all of its child elemenets from the opening of the tag to the ending of the tag.

```javascript
const html = await someElement.getOuterHtml();
```

### getProperty(key: string): Promise<Value>

Get property by this key from the current element. Value will contain null if it does not.

```javascript
context.assert(await input.hasProperty('checked')).equals(true);
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