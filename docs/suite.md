# Suite

A Suite is essentially a collection of test Scenarios. You will be able to choose which suite or suites you want to run, so it's important to think how you want to group them.

## Methods

### afterAll(callback: Function): Suite

Hit this callback after all Scenarios finish executing.

```javascript
suite.afterAll((suite) => {});
```

### afterEach(callback: Function): Suite

Hit this callback after each Scenario finishes executing.

```javascript
suite.afterEach((scenario) => {});
```

### base(parms: string | {} | Function): Suite

Set the base URL that all Scenarios in this Suite will use as its starting point.

This can be just a string:

```javascript
suite.base("https://www.google.com/");
```

Or it can be an object with environment as its key and the domain as its value.

```javascript
suite.base({
  prod: 'https://www.google.com/',
  stag: 'http://www.google.internal/'
  dev: 'http://www.google.local/'
})
```

Or it can be a callback function

```javascript
suite.base((suite) => {
  if (suite.executionOptions.environment == "prod") {
    return "https://www.google.com/";
  } else {
    return "http://www.google.internal/";
  }
});
```

### beforeAll(callback: Function): Suite

Hit this callback before the first Scenario starts executing.

```javascript
suite.beforeAll((suite) => {});
```

### beforeEach(callback: Function): Suite

Hit this callback before each Scenario starts executing.

```javascript
suite.beforeEach((scenario) => {});
```

### browser(title: string, opts: BrowserOptions): Scenario

Creates a new Scenario of the Browser request type. This will run a version of Chrominium with Puppeteer.

```javascript
suite.browser("User Sign Up Work Flow", {
  headless: true,
  width: 1280,
  height: 800,
});
```

### buildUrl(path: string): string

Creates a fully qualified URL based on the input string. This will be relative to the Suite's base.

```javascript
suite.buildUrl("/index.html");
```

### catch(callback: Function): Suite

Hit this callback after the Suite completes if there is an error or failure in any Scenario.

```javascript
suite.catch(() => {});
```

### execute(): Suite

If this string was told to wait() to execute, this will kick it off. This method will trigger the execute to then be called on each Scenario in the Suite.

```javascript
suite.execute();
```

### extjs(title: string, opts: any = {}): Scenario

Creates a new Scenario of the ExtJS request type. This will use Puppeteer just like the browser variety. The only difference is that it has Ext specific select methods and other helper methods to dig into this framework's custom internals.

```javascript
suite.extjs("User Sign Up Work Flow", {
  headless: true,
  width: 1280,
  height: 800,
});
```

### finally(callback: Function): Suite

Hit this callback after all Scenarios finish executing and after the Suite has been marked completed. This is the final step.

```javascript
suite.finally(() => {});
```

### html(title: string, opts: any = {}): Scenario

Creates a new Scenario of the HTML/DOM Only request type. This will use Cheerio to grab the HTML and load it into a jQuery-like DOM that we can test against. We can fake a browser here, allowing form completion, clicks, etc. However, it just is not a full browser so does not have JavaScript and won't work on SPAs, unless they have server side rendering as well.

```javascript
suite.html("Homepage Test");
```

### image(title: string, opts: any = {}): Scenario

Creates a new Scenario of the Image request type. This will grab only the first few bytes of the image (not download the entire thing). This allows us to quickly test the basic properties.

```javascript
suite.image("Make sure image loads and is correct width");
```

### json(title: string, opts: any = {}): Scenario

Creates a new Scenario of the JSON/API End Point request type.

```javascript
suite.json("Articles API Test");
```

### next(callback: Function): Suite

Hit this callback after all Scenarios finish executing, but before Suite has been marked as completed. There can be multiple nexts.

```javascript
suite.next(() => {});
```

### print(exitAfterPrint: boolean = true): void

Prints the results from the test execution to the console. This is often run inside the finally callback. If you leave the default argument as true, the process will terminate after it prints. So be sure to set that to false if you don't want it to do so.

```javascript
suite.finally((suite) => suite.print(false));
```

### promise(): Promise<Scenario>

Promisifies the Suite. The returned promise will resolve once all scenarios in the suite complete successfully.

```javascript
try {
  await mySuite.promise();
  console.log("all scenarios in the suite completed successfully!");
} catch (ex) {
  console.log("uh oh! one or more scenarios failed!");
}
```

### resource(title: string, opts: any = {}): Scenario

Creates a new Scenario of the Generic Resource request type. This is any other random type of file. You can test the file size, mime type, content, HTTP status, etc.

```javascript
suite.resource("Make sure this file loads");
```

### setConcurrencyLimit(maxConccurentRequests: number): Scenario

Limit the number of scenario HTTP requests that can fire at a time. It will execute them in batches and wait for the response to continue the next one.

```javascript
suite.setConcurrencyLimit(10);
```

### script(title: string, opts: any = {}): Scenario

Creates a new Scenario of the Script request type. It doesn't currently do anything more than load it. You can test the file size, mime type, HTTP Status, and such... so it may have some use but does not currently validate the JS.

```javascript
suite.script("Make sure JS file loads");
```

### subscribe(callback: Function): void

Adds this callback to a PubSub subscription to get notified on any updates with the execute of thie Suite.

This will probably return a handle to be able to unsubscribe later, but it doesn't return anything yet.

```javascript
suite.callback((suite: Suite, status: SuiteStatusEvent) => {});
```

### success(callback: Function): Suite

Hit this callback after all Scenarios finish executing if all Scenarios passed. This happens following after and next, but before finally.

```javascript
suite.success(() => {});
```

### verifySslCert(verify: boolean): Suite

Tells the request not to worry about verifying any SSL certs for HTTPS requests. This is helpful for local environments that may not have a valid cert. This value is passed on to any Scenarios created in this Suite, so you don't have to set it each time.

```javascript
suite.verifySslCert(false);
```

### video(title: string, opts: any = {}): Suite

Creates a new Scenario of the Video request type.

```javascript
suite.video("Make sure video loads");
```

### wait(verify: boolean = true): Suite

Tells this suite not to execute right away. Will not execute any scenarios until .execute() is called. This wait value gets passed to any Scenarios created under this Suite, so that you don't have to set it each time.

```javascript
suite.wait();
```

## Properties

### baseUrl: string

The base URL tha tis being used to execute Scenarios in this Suite. It will come from the settings in the .base() method and what environment is selected.

### executionDuration: number | null

The amount of time, in milliseconds, between when the first Scenario in the Suite started to execute and when the last one was completed.

### executionOptions: FlagpoleExecutionOptions

The execution options specified from the command line arguments or defaults. This notably includes environment.

```javascript
if (suite.executionOptions.quietMode) {
  console.log("shhhh!");
}
```

### title: string

The title of this suite, which is specified in the constructor.

### totalDuration: number | null

The total amount of time, in milliseconds, between when the Suite was initialized and when it was completed.
