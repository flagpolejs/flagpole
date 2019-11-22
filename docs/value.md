# Value

This object is the result of queried properties on a DOMElement, CSSRule, or from context.select('property') on a JSON/REST or Image type scenario. It is a wrapper of the actual underlying value that lets you do some nice things.

The main purpose of the Value object as a wrapper, rather than just dealing with the underlying data itself, is that Value has a name property as well. This is what allows Flagpole to devine intelligent assertion messages and other types of messages when you have not explicitly set one. Some other nice methods are also thrown in as a value add.

Value also has a toString method and a valueOf method, which are sort of JavaScript magic methods, that often allow you to use the Value object as if it were the underlying input itself.

For example this will automatically convert href to a string, even though it's actually a Value object.

```typescript
const href: Value = await element.getAttribute("href");
if (href == "http://www.flosports.tv") {
  console.log("Welcome to FloSports");
}
```

Likewise you can do an assertion with it:

```typescript
const href: Value = await element.getAttribute("href");
context.assert(href).equals("http://www.flosports.tv");
```

Similarly, you can do this with numeric operators.

```typescript
const numberOfImages: Value = (await context.findAll("img")).length;
if (numberOfImages > 0) {
  console.log("There are images on the page");
}
```

As you might have expected, this also works with assertions:

```typescript
const numberOfImages: Value = (await context.findAll("img")).length;
context.assert(numberOfImages).greaterThan(0);
```

To get the literal interal value you will use the .\$ property as a shorthand, which you will find useful as you go.

```typescript
const numberOfImages: Value = (await context.findAll("img")).length;
context.comment(`There are ${numberOfImages.$} images on the page`);
```

But there are also a lot of .to\* methods outlined below, which are extremely useful to converting or making sure it's the type you think it should be. For example:

```typescript
const inputValue: Value = await inputElement.getValue();
context.assert(inputValue.toInteger() + 1).equals(5);
```

Assuming the input element's value attribute was "4" if you did not use .toNumber() the assertion would have compared "41" since it would have appended the "1" to the string because JavaScript does things like that. So we convert it first, which will do a parseInt automatically for us so that we can do math on it correctly.

## Methods

### as(aliasName: string): Value

Save this value to an alias within the Scenario, so that it can be accessed later.

### getProperty(key: string): Promise<Value>

Get the property of this input value with the key. If there is no such property then it will return null. This is an async method.

```javascript
const isChecked = await element.getProperty("checked");
```

### hasProperty(key: string): Promise<Value>

If this element is an object of some sort, does it have the property matching key? Note this is an async function.

```javascript
context.assert(await element.hasProperty("qa-name")).equals(true);
```

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

## Properties

### \$: any (readonly)

This is a quick way to get the underlying value within this wrapper object.

### length: number (readonly)

Get the length of the input value. This could be the number of characters in a string-like value or the number of elements if it's an array.

### name: string (readonly)

Get a friendly name for this Value, which may be something like the selector if it's an element or something similar that is hopefully human readable. This is mainly used when you do not provide specific assertion messages so that Flagpole can create meaningful default messages.
