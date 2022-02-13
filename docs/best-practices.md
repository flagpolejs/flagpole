# Best Practices

## Selecting Values

:x: don't do this

```js
const meta = context.find("meta");
context.assert(meta).exists();
```

:green_apple: do this

```js
const meta = await context.exists("meta");
```

The [exists()](assertion-context?id=exists-promiseltvaluegt) method will find the element or property and make an assertion that it exists

---

:x: don't do this

```js
const data = await context.find("data");
context.assert(typeof data.$.name.firstName).equals("string"); // TypeError: Cannot read property 'name' of null
```

:green_apple: do this

```js
const data = await context.exists("data"); // ✕ EXISTS data[0]
const name = await data.exists("name");
const firstName = await name.exists("firstName");
context.assert(firstName).is.string();
```

Report a valid Flagpole failure instead of a JavaScript TypeError. Assert the properties exist all the way down.

## Arrays

:x: don't do this

```js
const dataArray = context.find("data");
const firstDataObj = dataArray.$[0];
```

:green_apple: do this

```js
const dataArray = await context.find("data");
const firstDataObj = dataArray.first;
```

Using [.$](value?id=-any-readonly) stips the Flagpole wrapper off of a value and prevents us from using Flapgole methods on that value.

You can use [first](value?id=first-value-readonly), [last](value?id=last-value-readonly), or [random](value?id=random-value-readonly) to grab items from an array and keep them wrapped in Flagpole's `value` type.

---

:x: don't do this

```js
const data = (await context.exists("data")).$;

data.products.map((product) =>
  context
    .assert("product color is valid", product.color)
    .in(["brown", "blue", "violet sky"])
);
```

:green_apple: do this

```js
const data = await context.exists("data");
const products = await data.exists("products");

context
  .assert("product colors are valid", products)
  .every((product) => ["brown", "blue", "violet sky"].includes(product.color));
```

[.every()](assertion?id=everycallback-function-promiseltassertiongt) will make a single assertion that all values in the array meet the condition. The test report will have one clean line instead of several from your `.map()`

## Documentation

:x: don't do this

```js
.next(async (context) => {
  console.log("Content section has a form");
  const form = await context.exists("#content form");

  console.log("Form method attribute is GET");
  context.assert(await form.getAttribute("method")).equals("GET");
});
```

:green_apple: do this

```js
.next("Content section has a form", async (context) => {
  const form = await context.exists("#content form");
  context
    .assert(
      "Form method attribute is GET",
      await form.getAttribute("method")
    )
    .equals("GET");
});
```

`console.log`s generally print above the output. They will be difficult to find and read inline.

---

:x: don't do this

```js
console.log(`There are ${data.length} products`);
context.assert(data).length.greaterThan(0);
```

:green_apple: do this

```js
context
  .assert("Should be more than one product in data", data)
  .length.greaterThan(0);
context.comment(`There are ${data.length} products`);
```

:green_apple: or this

```js
data.length
  .echo((n) => `There are ${n} products`)
  .assert("Should be more than one product in data")
  .greaterThan(0);
```

Flagpole will do it's best to print legible assertion titles to your test report. If you'd like something custom, use assertion titles instead by passing them as an initial argument in [.assert()](assertion-context?id=assert-assertion). It's also a good idea to use a subscenario title in your [.next()](scenario?id=next-scenario) callbacks.

## Modularization

:x: don't do this

```js
suite
  .json("Athletes")
  .open("/users")
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
    await context.exists("data");
    context.assert(context.response.loadTime).lessThan(1000);
  });

suite
  .json("Posts")
  .open("/posts")
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
    await context.exists("data");
    context.assert(context.response.loadTime).lessThan(1000);
  });

suite
  .json("Products")
  .open("/products")
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
    await context.exists("data");
    context.assert(context.response.loadTime).lessThan(1000);
  });
```

:green_apple: do this

```js
const basicAPIChecks = async (context) => {
  context.assert(context.response.statusCode).equals(200);
  await context.exists("data");
  context.assert(context.response.loadTime).lessThan(1000);
};

suite.json("Athletes").open("/users").next(basicAPIChecks);
suite.json("Posts").open("/posts").next(basicAPIChecks);
suite.json("Products").open("/products").next(basicAPIChecks);
```

Write once, reuse anywhere

---

:x: don't do this

```js
flagpole("Protected API")
  .beforeEach((scenario) => {
    // get API token via HTTP request before each scenario
    const token = new HttpRequest(...);
    return scenario.setBearerToken(token);
  });
```

:green_apple: do this

```js
const authenticateAPIRequest = async (scenario) => {
  // return cachedToken if we already made the request
  const cachedToken = FlagpoleExecution.global.getCache("apiToken");
  if (cachedToken) {
    return scenario.setBearerToken(cachedToken);
  }

  // get API token via HTTP request
  const token = new HttpRequest(...);
  // set it in global cache for the rest of the suites
  FlagpoleExecution.global.setCache("apiToken", token);
  // set the token for the scenario
  return scenario.setBearerToken(token);
};

flagpole("Protected API")
  .beforeEach(authenticateAPIRequest);
```

Send only one request for your token and reuse it for the rest of your suites via the `FlagpoleExecution` object cache. Values will be written to the `cache/` directory in your Flagpole project and cleared before every execution.

## Waiting

:x: don't do this

```js
await context.click("#frmSubmit");
await context.pause(500);
const formError = await context.find(".form-error");
```

:green_apple: do this

```js
await context.click("#frmSubmit");
const formError = await context.waitForExists(".form-error");
```

Explicit waits can cause flake. Use a [waitFor\*](assertion-context?id=waitforexistspath-string-timeout-number-promiseltdomelementgt) utility instead.

## Interacticing with the DOM

:x: don't do this

```js
await context.type("#userName", "foo");
await context.type("#password", "bar");
```

:green_apple: do this

```js
const form = await context.find("form");
await form.fillForm("id", {
  userName: "foo",
  password: "bar",
});
```

Using [.type()](assertion-context?id=typepath-string-texttotype-string-opts-any-promiseltvoidgt) isn't bad, but if you have many fields to fill out, [.fillForm()](value?id=fillform-promiseltvaluegt) might be a better alternative.

## Asynchronous

:x: don't do this

```js
const suite = flagpole("POST, GET, and DELETE a product");

let productId;

suite
  .json("Scenario A")
  .open(`POST /api/v1/products`)
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
    productId = (await context.exists("id")).$;
  });

suite
  .json("Scenario B")
  .open(`GET /api/v1/products/${productId}`) // undefined
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
  });
```

:green_apple: do this

```js
const suite = flagpole("POST, GET, and DELETE a product");

suite
  .json("Scenario A")
  .open(`POST /api/v1/products`)
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
    const productId = (await context.exists("id")).$;
    scenarioB.execute({ productId });
  });

const scenarioB = suite
  .json("Scenario B")
  .open("GET /api/v1/products/{productId}")
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200);
  });
```

Scenario [.open()](scenario?id=openurl-string-scenario)s are scheduled with the suite task manager before any requests are made. If you need to wait for some value, use `{someValue}` in your `.open` method and the scenario will wait until you call `.execute({someValue: '123'})` with the awaited value.

:green_apple: do this

```js
flagpole("POST, GET, and DELETE a product", async (suite) => {
  let productId;

  await suite
    .json("Scenario A")
    .open(`POST /api/v1/products`)
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
      productId = (await context.exists("id")).$;
    })
    .waitForFinished();

  await suite
    .json("Scenario B")
    .open(`GET /api/v1/products/${productId}`)
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
    })
    .waitForFinished();

  await suite
    .json("Scenario C")
    .open(`DELETE /api/v1/products/${productId}`)
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
    })
    .waitForFinished();
});
```

Alternatively, you can use a suite callback to manage asynchronous flow of scenarios. Typically, globally-scoped scenarios run synchronously. Above, we use `await` and [.waitForFinished()](scenario?id=waitforfinished-promiseltvoidgt) to control the flow. Contrary to globally-scoped scenarios, the `.open` method is not registered with the task manager until execution, so we can use variable values here.
