# CSSRule

This object contains declarations for a given CSS selector. You would get this within the context of a Stylesheet scenario. This would come from a this select('#myElement') type selector from the AssertionContext.

## Methods

### hasProperty(key: string): Promise<boolean>

Test whether this rule has the given CSS property.

```javascript
const rule = await context.select('body');
context.assert(await rule.hasProperty('background')).equals(true);
```

### getProperty(key: string): Promise<Value | null> 

Get the matching property for this CSS Rule. Returns null if the property does not exist.

```javascript
const rule = await context.select('body');
context.assert(await rule.getProperty('background')).equals('#ffffff');
```

## Properties 

### $: any (readonly)

This is a quick way to get the underlying value within this wrapper object.

### path: string (readonly)

The selector path that was used to query this rule.

### name: string (readonly)

Get a friendly name for this Value, which may be something like the selector if it's an element or something similar that is hopefully human readable. This is mainly used when you do not provide specific assertion messages so that Flagpole can create meaningful default messages.