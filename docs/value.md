
# Value

This object is the result of queried properties on a DOMElement, CSSRule, or from this.select('property') on a JSON/REST or Image type scenario. It is a wrapper of the actual underlying value that lets you do some nice things.

## Methods

### getProperty(key: string): Promise<Value>

Get the property of this input value with the key. If there is no such property then it will return null. This is an async method.

### hasProperty(key: string): Promise<Value>

If this element is an object of some sort, does it have the property matching key? Note this is an async function.

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

### toString(): string

Casts the input value as a string. 

### toType(): string

Grabs the type of the input value. It will be all lowercase and is a deep type look up, beyond a normal typeof.

## Properties 

### $: any (readonly)

This is a quick way to get the underlying value within this wrapper object.

### length: number (readonly)

Get the length of the input value. This could be the number of characters in a string-like value or the number of elements if it's an array.

### name: string (readonly)

Get a friendly name for this Value, which may be something like the selector if it's an element or something similar that is hopefully human readable. This is mainly used when you do not provide specific assertion messages so that Flagpole can create meaningful default messages.
