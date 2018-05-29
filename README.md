# Flagpole

*"Run it up the flagpole and see who salutes"*

This quote represents to float an idea or concept out there and test the results. So in our context we are flying our code by this quick QA test framework and testing its success.

It is created as a quick way to run smoke or integration tests against an application that produces and HTML output. It does not run a full browser, but instead just pulls the HTML code and evaluates the DOM. So it is not an e2e, UI, browser, CSS, or JavaScript test. It does not execute any embedded scripts, so it can't be used for dynamically generated SPAs or the like. That is, unless they get pre-compiled on the server side.

Flagpole is also suitable for testing REST API frameworks, currently only supporting JSON format. We don't have plans currently to add support for XML or SOAP formats, because they suck. But hey if you want to add it, that wouldn't be too hard!

## QA Terminology

**Group** A group of suites, which is within Flagpole defined just by grouping suites into subfolders of the tests folder.

**Suite:** A suite is a logical group of tests that you would always want to run together. It is recommended that you create one suite per file in the tests folder.

**Scenario:** Within a suite of tests, you will define one or more different scenarios. This would typically define a goal that a user might be trying to accomplish or otherwise the "thing" that the tests in that scenario are trying to prove works. So usually you would have one endpoint or page per scenario. And you would have one or more scenario per page or endpoint.

**Assertion:** With Flagpole, unlike some other test frameworks, you will not typically call assert directly. However, we will refer to it in this documentation. An assertion is a statement that you want to test that you are saying should be true.

## Format of a test suite

Every suite should be located in its own file within the tests folder (or a subfolder).

It should start with the definition of the suite's name, like:

```
Flagpole.Suite('iTunes API Tests')
````

This is not required but typically after that you would define the base URL that you want to use. All of the scenarios will build their URL off of this base.

```
.base('https://itunes.apple.com')

```

Next we would usually define each scenario, like so:

```
.Scenario('See if there are any 2Pac Videos')
```

Next we need to define the type of scenario this is, currently either "html" or "json" but more may be added. HTML is the default, so if you're testing a REST API be sure to set it:

```
.type('json')
```

Then we would typically specify the endpoint that are want to hit. Remember this gets build in context with the base URL that we specified earlier, so you should not enter the full URL path.

There are some cases where we may not want to set it yet, like if the URL of the test will be dynamic based on the result of another test. We'll get to that later, but in that case you'd skip this step.

```
.open('/search?term=2pac&entity=musicVideo')
```

And finally we do our assertions callback, which will get called after the page or endpoint loads.

```
.assertions(function(test) {
   // Your test assertions will go in here
}
```

Putting it all together it would look like this:

```javascript
import { Flagpole } from 'flagpole';
// or
let Flagpole = require('flagpole').Flagpole;


Flagpole.Suite('iTunes API Tests')
    .base('https://itunes.apple.com')

    .Scenario('See if there are any 2Pac Videos')
    .type('json')
    .open('/search?term=2pac&entity=musicVideo')
    .assertions(function(test) {
        // Your test assertions will go in here
    });
```

