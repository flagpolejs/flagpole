# iAssertionSchema

This is an interface to follow in order to test whether a given JSON response matches this defined structure.

In its simplest form you can just define an object with properties of the JSON property names and strings with the type.

```javascript
const schema = {
    properties: {
        id: "number",
        firstName: "string",
        lastName: "string",
        isActive: "boolean",
        teams: "array"
    }
}
```

This would match a JSON body like this:

```javascript
{
    id: 5,
    firstName: "George",
    lastName: "Brett",
    isActive: false,
    teams: [
        "Kansas City Royals"
    ]
}
```

Whenever we define a value in our schema as a string, we are defining its type. Technically, we could use a more verbose schema definition for the same thing, like this:

```javascript
const schema = {
    properties: {
        id: { type: "number" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        isActive: { type: "boolean" },
        teams: { type: "array" }
    }
}
```
But there really is no point in doing that if we simply want to verify the type.

The above works well for a flat structure, but when we start to get nested with arrays or objects then what? Well the next step is we want to make sure every team listed inside the `teams` array of our JSON body above is a string. Here's how we can do that.

```javascript
const schema = {
    properties: {
        id: "number",
        firstName: "string",
        lastName: "string",
        isActive: "boolean",
        teams: {
            type: "array",
            items: "string"
        }
    }
}
```

For our teams property, we used that object notation check that it was an array with the `type` property. But we also see the `items` property. Setting this to a string value will verify that each item in the array is a string. Obviously you could put "number" or "boolean" or whatever other type there in that `items` property to test that every element in the array is that type.

But what if our JSON structure was more complicated? What if the array contained objects with multiple properties? Let's assume our JSON body is this...

```javascript
{
    id: 5,
    firstName: "George",
    lastName: "Brett",
    isActive: false,
    teams: [
        {
            name: "Kansas City Royals"
            firstSeason: 1973,
            lastSeason: 1994
        }
    ]
}
```

We would define this schema like this:

```javascript
const schema = {
    properties: {
        id: "number",
        firstName: "string",
        lastName: "string",
        isActive: "boolean",
        teams: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: "string",
                    firstSeason: "number",
                    lastSeason: "number"
                }
            }
        }
    }
}
```

So, rather than setting `items` to a string, this time we set it to another object. This effectively is a nested sub-schema. We could keep going with this as deep as we needed to go.

Alright great. George Brett is long retired, so he has a `firstSeason` and `lastSeason` property. However, let's say in our schema that if a player is currently active the `lastSeason` property will be absent from the response. We still want to make sure that if it is present it is a number. But we don't want our schema to fail if it's not there.

This is where the `optional` property comes in.

```javascript
const schema = {
    properties: {
        id: "number",
        firstName: "string",
        lastName: "string",
        isActive: "boolean",
        teams: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: "string",
                    firstSeason: "number",
                    lastSeason: {
                        type: "number",
                        optional: true
                    }
                }
            }
        }
    }
}
```

Well that was easy! Okay, that works when the field is absent for active players. What if lastSeason is always there, but instead it is `null` when they are still active? No problemo!

```javascript
const schema = {
    properties: {
        id: "number",
        firstName: "string",
        lastName: "string",
        isActive: "boolean",
        teams: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: "string",
                    firstSeason: "number",
                    lastSeason: [ "number", "null" ]
                }
            }
        }
    }
}
```

If we set any of our properties to an array of strings, instead of a string, the schema will verify that it is one of those types.

Let's keep amping up the game. Now, rather than just the type, we also want our schema to have an opinion on the actual value. So first, let's start when there are a small set of allowed values. For example, position in baseball. So let's assume our JSON body is this (trimmed it down for simplicity):

```javascript
{
    id: 5,
    firstName: "George",
    lastName: "Brett",
    positionsPlayed: [ "1b", "3b", "dh" ]
}
```

We could validate that all of the values in the `positionsPlayed` array are a valid baseball position.

```javascript
const schema = {
    properties: {
        id: "number",
        firstName: "string",
        lastName: "string",
        positionsPlayed: {
            type: "array",
            properties: {
                type: "string",
                enum: [ "1b", "2b", "ss", "3b", "of", "sp", "rp", "c", "dh" ]
            }
        }
    }
}
```

And that works fine, but baseball players also have numbers on their jersey. But no baseball player is going to have a number over 99, so we want to make sure that it seems valid. Here's our new JSON body:

```javascript
{
    id: 5,
    firstName: "George",
    lastName: "Brett",
    jerseyNumber: 5
}
```

So let's use a regular expression to verify the `jerseyNumber`.

```javascript
const schema = {
    properties: {
        id: "number",
        firstName: "string",
        lastName: "string",
        jerseyNumber: {
            type: "number",
            matches: /^[0-9]{1,2}$/
        }
    }
}
```

We could have also done this with another property which is `test`. This property is a function that allows you to run whatever kind of logic you want. So let's change our last one to use a test callback instead.

```javascript
const schema = {
    properties: {
        id: "number",
        firstName: "string",
        lastName: "string",
        jerseyNumber: {
            type: "number",
            test: function(value) {
                return (value >= 0 && value < 100);
            }
        }
    }
}
```

Obviously using the `test` function you could get more complicated with your logic. Besides the first `value` argument called above, the `test` method also receives a second `opts` argument. This contains the following properties:

* path = The path of the current item
* parent = The last parent item, which would be the array or object this propert is a part of
* root = The root document that we are evaluating

This allows us to potentially look back at previous values to make sure the current one makes sense relative to the others. For example, it would not make sense for `firstSeason` to be after `lastSeason`. So let's test that.

Here's the JSON structure that we are testing:

```javascript
{
    id: 5,
    firstName: "George",
    lastName: "Brett",
    firstSeason: 1973,
    lastSeason: 1994
}
```

We will apply this schema to be sure the season years are valid:

```javascript
const schema = {
    properties: {
        id: "number",
        firstName: "string",
        lastName: "string",
        firstSeason: "number",
        lastSeason: {
            type: [ "number", "null" ]
            test: function(value, opts) {
                return (
                    value === null ||
                    value >= opts.parent.firstSeason
                );
            }
        }
    }
}
```

# AssertionSchema

This is a class that allows you to validate a schema. Typically, you will not be using this directly. But for completeness it is documented below.

The constructor accepts the schema and JSON document to be evaluated.

```typescript
const personSchema: iAssertionSchema = {
    properties: {
        id: "number",
        firstName: "string",
        lastName: "string"
    }
};
const jsonBody = {
    id: 234,
    firstName: 'Karl',
    lastName: 'Snyder'
};

const assertionSchema: AssertionSchema = new AssertionSchema();
const isValid: boolean = await assertionSchema.validate(personSchema, jsonBody);
```

## Properties

### errors: Error[]

Gives you the last error encountered during the validation process. This will be null until the validate() method is run.

## Methods

### validate(schema: any, root: any): Promise<boolean>

This will always resolve either true or false.
