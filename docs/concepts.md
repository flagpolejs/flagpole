# Core Concepts

Here is a sort of glossary of core QA terminology and concepts that Flagpole uses.

## Suites

A suite is collection of similar tests. Typically it will be rahter large, but it could be narrow as well. It will group together a group of scenarios that usually go together. You will typically execute one or more suites, depending on what aspect you need to test.

# Scenario

Think of a scenario as a situation that you want to evaluate. Perhaps it is logging into the site and making sure you can access premium content. Another scenario, conversely, might be not being logged into the site and making sure you can't see what is behind the paywall.

A scenario should represent a specific action you want to take. And often you might also think of the scenario being related to a specific persona, which is an archetype of a particular user. A scenario will usually contain multiple steps with assertions along the way.

# Assertion

An assertion is a particular statement that you are saying is true. For example "I assert that the ocean is wet" or "I assert a dropped ball will fall to the ground." Now if those assertions fail we have to rethink our whole laws of physics!

But that's the idea. We often assume that our site will behave in a certain way... until it doesn't. So our assertions should test each of our very basic understandings of what should happen--those are positive tests. Further, when you get to next level QA you will couple that will negative tests like "I assert I can not walk through this wall." 

The final level of QA greatness is when you add in what I call (and QA insiders tell me isn't a real term) jerk tests. This is something like typing in a string or a negative number into a quantity field and making sure the site doesn't break or (more ideally throws up a pertinent error message.

All of these things are accomplished by making assertions.

# Headless and headful browsers

When you are doing a full browser test, you can run it in either "headful" mode, which means you can see the physical manifestation of a browser while it's running. Or you can run it in "headless" mode, which means you do have a full browser running the tests, but there is no UI actually visible on screen. Note that even in headless mode, you can capture screenshots along the way.

# Puppeteer

[Puppeteer](https://pptr.dev/) is an open source tool where you can automate actions in Chromium (almost identical to Chrome) released by. It is similar to how many QA framweorks might use Selenium, other similar packages such as NightmareJS or (the now suspended) PhantomJS.

# DOM

DOM stands of document object model. This is a hierarchical structure of a document, usually this refers to an HTML or XML document.  You can refer to any given element within the document by a selector path, which gives its location relative to the other elements in the document--essentially giving you a map to find it.

Two schemes for addresses within the document are CSS Selectors and XPath. Flagpole uses CSS Selectors for HTML. 

# CLI

Command line interface is a collection of commands, starting with a given keyword (`flagpole` in our case) that can be typed at the terminal to make certain actions happen. 

# async...await

This is a core modern JavaScript concept that is always coupled. A function designated as `async` means that its contents are expected to run asynchronously -- not linearly with the rest of the code around it -- and it will return a Promise automatically. Inside of it we may have the `await` keyword which meands this thing that I am calling is going to run asynchronously and return a Promise, but wait on this line for that Promise to resolve to the actual value.

# Promise

This is another core JavaScript concept where the code says: "I'm going to go work on doing this thing, and I'll let you know when I'm done." A Promise will either `resolve` or `reject`. If it resolves then it will give you the value it promised. If it rejects then it has broken its promise, typically with some sort of error.

The response to a Promise is captured either by a `then` and `catch` callback... or by `await` as previously explained.

# Arrow Functions

An arrow function is a modern JavaScript construct that looks like this with no arguments:

```javascript
() => {
    console.log('Do some things');
}
```

Or

```javascript
(something, somethingElse) => {
    console.log(`Let's echo ${something} and ${somethingElse}`);
}
```

Or, with a single argument it can be written as:

```javascript
result => {
    console.log(`Let's echo ${result}`);
}
```

It is almost the same as a normal function like `function (result) { }` with one important exception. When you use a normal function the `this` inside of it can be confusing if you don't know exactly the context that it is executed in. But with an arrow function the `this` is always preserved as the same thing it was outside of that function. In other words, it preserves the current scope.

Arrow functions are very much in favor in the latest JavaScript trends as both shorthand and less confusion around the context. For Flagpole we will use arrow functions by default with the context being passed in as the first argument. However, you could also go back to using traditional `function` syntax and use the `this` keyword and not rely on setting a context argument.

In other words:

```javascript
.next(async function() {

})
```

Versus

```javascript
.next(async (context) => {

});
```

The async keyword before either of those examples is technicaly optional. However, as mentioned earlier, you'll need to designate the function as `async` if you want to do `await` within it. So by default the Flagpole CLI will add it and our documentation will assume the arrow function plus `context` argument are set. One last note: you can change `context` to any other name you want such as `ctx` or `test` ... just not to a reserved word like `this`.
