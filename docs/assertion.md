# Assertions

Create an assertion within your scenario's `next` blocks like this.

```javascript
context.assert(myValue);
```

You can also specify a message first, to override Flagpole's attempt at creating a default assertion method. That way it is really descriptive of what that assertion checks for.

```javascript
context.assert("Make sure my value is a number", myValue);
```

This alone does nothing, since it just creates the assertion object with the value you want to assert against. But it hasn't actually asserted anything. So use one of the methods below.

## Properties

In addition to the methods to make the assertions, you can change them by chaining these properties.

### length: Assertion

This causes the assertion to evaluate the length of the input value, rather than the actual value. This works for anything that supports length including strings and arrays. For other things it will cast the input to a string and evaluate it.

```javascript
context.assert("foobar").length.equals(6);
```

### not: Assertion

Flips the assertion to be the negative of itself.

```javascript
context.assert(5).not.equals(6);
```

### optional: Assertion

This makes the assertion consider optional, meaning its failure won't cause the entire scenario to fail. If it passes, it will be listed as a pass. If it fails, it will be shown as failing in a special type of comment. That way you can see it, but not hold up the deploy because of it.

```javascript
context.assert(5).optional.equals(6);
```

### trim: Assertion

This will create a new assertion with the string value of the original input trimmed.

```javascript
context.assert(" foobar ").trim.equals("foobar");
```

### type: Assertion

This causes the assertion to evaluate the type of the value, rather than the actual input value. The type will always be a lowercase string. It is a smart typeof that can tell things like 'promise' and 'regexp' that might otherewise evaluate to plain old object.

```javascript
context.assert(5).type.equals("number");
```

## Methods

All methods return the Assertion itself, unless otherwise noted.

### as(aliasName: string): Assertion

Save the input value of this assertion to an alias within the Scenario, so that it can be accessed later.

### between(min: number, max: number): Assertion

Works for numbers, but also casts strings to numbers for the compare. Tests if this value is between the minimum and maximum.

```javascript
context.assert(myValue).between(0, 10);
```

### contains(value: any): Assertion

Tests whether the input value contains the argument. This works for strings, arrays, and even for objects. If it's an object, it checks if a property exists with that value.

```javascript
context.assert("foobar").contains("foo");
```

### endsWith(value: any): Assertion

Tests whether the input value ends with the argument. Also works with arrays, testing whether the argument is the last value of the array.

```javascript
context.assert("foobar").endsWith("bar");
```

### equals(value: any): Assertion

This can be used with any type of value. It uses a rough (double equals) equality versus the exactly method that uses a precise (triple equals) equality.

```javascript
context.assert(myValue).equals(5);
```

If the values are objects it will test for a deep-equals with standard quality checks. If the values are arrays, it will check each array item.

### every(callback: Function): Promise<Assertion>

Loops throught the input value, which should be an array, and checks them against the callback function to be sure that every one is true.

```javascript
context.assert(["eminem", "dre", "ice cube"]).every((rapper) => {
  return rapper.indexOf("e") >= 0;
});
```

This method can also handle async callbacks.

```javascript
context.assert(navBarLinks).every(async (link) => {
  const innerText = await link.getInnerText();
  return innerText.toString().length > 0;
});
```

Since it returns a promise, if you need your asseretions to run in order be sure to prefix it with `await`

```javascript
await context.assert(links).every((link) => {
  return link.tagName === "a";
});
```

### exactly(value: any): Assertion

This asserts an exact match with precise (triple equals) equality.

```javascript
context.assert(myValue).exactly(5);
```

If the values are objects it will test for a deep-equals with strict quality checks. If the values are arrays, it will check each array item.

### exists(): Assertion

Tests whether the input value is not null or undefined. This works well for selecting a DOM Element and then testing if it actually existed (since it returns null if not).

```javascript
context.assert(await context.select("article")).exists();
```

### greaterThan(value: number): Assertion

Works for numbers, but also casts strings to numbers for the compare.

```javascript
context.assert(myValue).greaterThan(5);
```

### greaterThanOrEquals(value: number): Assertion

Works for numbers, but also casts strings to numbers for the compare.

```javascript
context.assert(myValue).greaterThanOrEquals(5);
```

### in(listOfValues: any[]): Assertion

Tests whether the input value is in the array of possible values.

```javascript
context.assert("2pac").in(["2pac", "biggie", "daz"]);
```

### includes(value: any): Assertion

Tests whether the input array includes the argument.

```javascript
context.assert(["2pac", "biggie", "daz"]).includes("2pac");
```

### lessThan(value: number): Assertion

Works for numbers, but also casts strings to numbers for the compare.

```javascript
context.assert(myValue).lessThan(5);
```

### lessThanOrEquals(value: number): Assertion

Works for numbers, but also casts strings to numbers for the compare.

```javascript
context.assert(myValue).lessThanOrEquals(5);
```

### like(value: string): Assertion

Like is a more fuzzy match. It ignores type differences and also trims whitespace and compares strings all lowercase. So it indicates the values are similar, but not necessarily equal.

```javascript
context.assert(myValue).like("FooBar");
```

### looksLike(image: string | Buffer, threshold: string | number): Assertion

Do a visual comparison of two images. This can be used with screenshots or comparing any two other images. Normally you'd have a control image saved with in the repository to compare against.

If you pass a string starting with `@` it will automatically look in Flagpole's images folder (located at `./tests/images/` by default). This is the preferred way to use the method. No file extension is necessary.

```typescript
context.assert(screenshot).looksLike("@homepage");
```

Alternately, you can pass in the file path.

```typescript
context.assert(screenshot).looksLike("./my-screenshots/homepage.png");
```

The second (optional) argument is `threshold`. This represents the allowed range of difference to give it some wiggle room. A lower number would indicate less allowed difference.

If this argument is passed in as a number, it must greater than or equal to 0 and less than 1. The default is 0.1, which would incate only allow 10% difference between the two images.

```typescript
context.assert(screenshot).looksLike("./screenshots/homepage.png", 0.05);
```

Alternately, you can pass the `threshold` argument as a string. In this mode, it will be interpretted as a percentage.

```typescript
context.assert(screenshot).looksLike("./screenshots/homepage.png", "5%");
```

The first time that you run the test, if the control image does not exist, the assertion will automatically pass. The screenshot that you passed in will be saved in the file path specified and will become the control for future test runs. If your page changes dramatically in the future, simply delete your control image to reset the base case.

If you prefer, you can pass in the buffer of the image file that you've read from disk or a web site or elsewhere.

```typescript
context.assert(screenshot).looksLike(imageBuffer, 0.05);
```

### matches(): Assertion

#### matches(pattern: RegExp | string): Assertion

Regular express compare of strings.

```javascript
context.assert(myValue).matches(/^[a-z0-9]{3,32}$/i);
```

#### matches(pattern: object | any[]): Assertion

If you pass in an object or an array, it will be evaluated as an example pattern for the JSON object. To do this, it will dynamically generate a schema for the pattern you passed in. The value will be checked against that schema.

```javascript
context.assert(jsonData).matches({
  meta: {
    count: 1,
  },
  data: [
    {
      id: 123,
      name: "Foobar",
      active: true,
    },
  ],
});
```

The above example schema evaluates for matching types, not values.

### none(callback: Function): Promise<Assertion>

Loops throught the input value, which should be an array, and checks them against the callback function to be sure that none are true.

```javascript
context.assert(["2pac", "biggie", "daz"]).none((rapper) => {
  return rapper == "snoop";
});
```

### nth(index: number): Assertion

Change the assertion to be against the `n`th value from the array or object.

```javascript
context.assert("2nd item is a string", array).nth(1).type.equals("string");
```

### pluck(property: string): Assertion

When the assertion contains an array of objects, this will change the assertion to be against an array of values in the specified property.

```javascript
context
  .assert("Every name is a string", array)
  .pluck("name")
  .every((name) => typeof name == "string");
```

### rejects(): Assertion

Tests whether the input promise rejects.

```javascript
await context.assert(myPromise).rejects();
```

### resolves(): Assertion

Tests whether the input promise resolves.

```javascript
await context.assert(myPromise).resolves();
```

### schema(schema: Schema, schemaType?: "JsonSchema" | "JTD"): Promise<Assertion>

Test whether the input matches the schema provided. This is only valid for testing JSON. This assertion is async (returns a promise) so you should either await it or return it at the end of a next block. Flagpole supports two specifications: JSON Schema and JSON Type Definition ("JTD"). The default is "JsonSchema".

Either way, the syntax to make the assertion will be the same:

```typescript
await context.assert(jsonResponse).schema(mySchema);
```

### schema(shemaPath: string, schemaType?: "JsonSchema" | "JTD")): Promise<Assertion>

Pass in a name or path of a schema to check against. The first time you run this assertion (or if the file doesn't exist), it will PASS the test and CREATE the schema file for you from a snapshot of the current JSON response. This makes it trivial to create your control schema to test against on future runs.

You can run it was a file path, pointing to the location of your schema file.

```typescript
await context
  .assert(context.response.jsonBody)
  .schema("./some/path/article-list.json");
```

But if you start the path with `@` then you only need to provide a name. This will automatically store it in the Flagpole schemas folder (by default is `./tests/schemas/`) as a `.json` file with that name. This is the preferred way to use the method.

```typescript
await context.assert(context.response.jsonBody).schema("@article-list");
```

### some(callback: Function): Promise<Assertion>

Loops throught the input value, which should be an array, and checks them against the callback function to be sure that at least one is true.

```javascript
context.assert(["dre", "snoop", "2pac"]).some((rapper) => {
  return rapper.indexOf("e") >= 0;
});
```

### startsWith(value: any): Assertion

Tests whether the input value starts with the argument. Also works with arrays, testing whether the argument is the first value of the array.

```javascript
context.assert(["foo", "bar"]).startsWith("foo");
```
