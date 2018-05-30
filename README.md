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
.assertions(function(response) {
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
    .assertions(function(response) {
        // Your test assertions will go in here
    });
```

## Response Traversal

Once the endpoint is loaded, the assertions callback will fire with the response object. 

The first thing you may want to do is test some of the basic response headers and such. Things like...

```javascript

// Check for HTTP status code
response.status().equals(200);
// Check for certain header values
response.headers('Content-Type').contains('text/javascript');
response.headers('content-length').greaterThan(0);

```

Now let's look into the response body and check for certain things to exit. We want to traverse the body. This works both for HTML and JSON responses.

So for an HTML response, we might want to do something with CSS selectors like:

```javascript
var topStories = reponse.select('#topStories articles');
```

While for a JSON response we may want to do:

```javascript
var results = response.select('data.results');
```

Once you have grabbed a certain element like that, you could do further traversal. Some are available for JSON too, but this is usually more of an HTML thing.

```javascript
var summaries = topStories.find('p.summary');
```

You could also do most of the jQuery methods like children, closest, next, etc. But I won't get into all of those for now.

For a selector that returns a multiple matching elements, you can also use nth (or its synonym eq), first, and last.

## Making assertions

Cool! So now we selected something....

```javascript
var results = response.select('data.results');
```

"But what do we do with it???" Well, I'm glad you asked, young padwan! We make assertions.

But just because we have an element... that doesn't mean we want to make an assertion against the element directly. No, more like you wan to make an assertion about something about that element.

Like maybe we want to make sure it is a certain data type.

```javascript
results.is('array');
```

Well that was easy, but what if we also want to make sure the array isn't empty?

```javascript
results.length().greaterThan(0);
```

BAM! Okay, okay, but let's check some of the actual content. Sure...

```javascript
results.first().property('id').is('number').greaterThan(0);
```

Ohhh... see I'm pretty slick there with my chaining. Like when you do a spin move on the dance floor and then throw in a split at the end or something.

So above we selected the first element of the results array, and then looked at the id property.

Built in with that property('id') method is an exists() call, so we don't need to explicitly check for the exists. And then we chain it to then make sure it's a number that is greater than 0.

What else can we check for?

```javascript
let firstElement = results.first();
firstElement.property('id').is('number').greaterThan(0)
    .and().property('kind').equals('music-video')
    .and().property('artist-name').contains('Makaveli')
    .and().property('first-name').startsWith('Tu')
    .and().property('last-name').endsWith('ur')
    .and().property('status').matches(/hip-?hop/i)
    .and().property('genre').similarTo('greatest of all time');
```

Alright, so we started using and(). This makes it a bit more legible, but also whenever you use and() it returns you back the last element that you traversed to. So sometimes you get lost in your chaining and you might end up being on a property, but you want to get back to the element. The and() will go back to that last thing you got from a traversal method.

If, on the other hand, you just wanted to do two tests on the same property then you don't need the and() ... like this:

```javascript
let firstElement = results.first();
firstElement.property('artist-name').startsWith('Tu').endsWith('pac');
```

Got it?


## Loops

So what if you want to loop through all elements in that results array? We got you!

Remember earlier we fetched the results array? Let's loop through each element of that.

```javascript
results.each(function(track) {
    track.property('trackId').is('number');
    track.property('kind').equals('music-video');
});
```

## Delaying execution and dynamic endpoints

...

## Using the CLI

...

## More Advanced Topics

...
