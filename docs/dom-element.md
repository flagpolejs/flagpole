# DOMElement

This object contains elements within the DOM for Puppeteer browser scenarios or Cheerio HTML scenarios. You typically get this element by way of this.select('css selector path') from the AssertionContext.

## Methods

### getClassName(): Promise<Value>

Get the class name of this element. If there are multiple classes then they will be space delimited.

```javascript
const className = await someElement.getClassName();
```

### getData(key: string): Promise<Value>

Get data property by this key from the current element. Value will contain null if it does not.

```javascript
this.assert(await element.getData('athlete-id')).equals(123);
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
this.assert(await input.hasProperty('checked')).equals(true);
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
this.assert(await img.hasAttribute('src')).equals(true);
```

### hasClassName(className: string): Promise<Value>

Does this element have the given class? The value will contain boolean.

```javascript
this.assert(await element.hasClassName('heading')).equals(true);
```

### hasData(key: string): Promise<Value>

Does this element have a data property by this name?

```javascript
this.assert(await element.hasData('athlete-id')).equals(true);
```

### hasProperty(key: string): Promise<Value>

Does this element have a property by this name?

```javascript
this.assert(await input.hasProperty('readonly')).equals(true);
```

## Properties 

### $: any (readonly)

This is a quick way to get the underlying value within this wrapper object. So that will typically be either an ElementHandle if a browser test or a Cheerio object if an html test.

### name: string (readonly)

Get a friendly name for this DOMElement, which may be something like the selector if it's an element or something similar that is hopefully human readable. This is mainly used when you do not provide specific assertion messages so that Flagpole can create meaningful default messages.

### path: string (readonly)

The selector requested to query this DOMElement.