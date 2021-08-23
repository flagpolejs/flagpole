# Flagpole Release Notes

## 2.6 (Minor Version)

### Summary

- Removed support for "stylesheet", "video", "audio", and "script" scenarios. Use generic "resource" instead.
- Changed AJV from an optional to mandator dependency
- Schema assertions now support both major specifications: JSON Schema and JSON Type Definition (JTD)
- Error messages on schema failures now properly give the path of where they failed in the schema. Much needed context!
- Removed custom JSON Validator to use AJV exclusively (for now at least) and moved JSON Validator to its own
  standalone repo [https://github.com/flagpolejs/json-validator]
- Spun off JSON to JSON Schema into its own repo: [https://github.com/flagpolejs/json-to-jsonschema]
- Created new repo called JSON to JTD [https://github.com/flagpolejs/json-to-jtd]
- Added new `template` method that helps automate creating similar scenarios with less code

### New Template Method

```
const get = suite.template({
    type: "html",
    method: "get",
    statusCode: 200,
});

get("Landing page", { url: "https://www.google.com/" });
get("Search results page", { url: "https://www.google.com/search?q=test" });
```

### JSON Schema and JTD support

You can contnue to use JSON Schema as before with:

```
context
    .assert(context.response.jsonBody)
    .schema(jsonSchema, "JsonSchema");
```

But you can now also use JTD format:

```
context
    .assert(context.response.jsonBody)
    .schema(jsonSchema, "JTD");
```

The "simple" format that was previously built into Flagpole has now been removed. It may be added back in the future. But this is a breaking change if you were using some of the proprietary features of it, where it differed from JSON Schema. However, probably no one was using it beacuse you'd have had to write the schema by hand.

If you used the old format with a boolean second paramter to force the built-in simple validator, a `true` will now default to use "JsonSchema" and a `false` would instead use JTD. While this isn't truly backwards compatible, it will most likely work for you out of the box.

```
context
    .assert(context.response.jsonBody)
    .schema(jsonSchema, true);
```
