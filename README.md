# Flagpole

*"Run it up the flagpole and see who salutes"*

This quote represents to float an idea or concept out there and test the results. So in our context we are flying our code by this quick QA test framework and testing its success.

It is created as a quick way to run smoke or integration tests against an application that produces and HTML output. It does not run a full browser, but instead just pulls the HTML code and evaluates the DOM. So it is not an e2e, UI, browser, CSS, or JavaScript test. It does not execute any embedded scripts, so it can't be used for dynamically generated SPAs or the like. That is, unless they get pre-compiled on the server side.

Flagpole is also suitable for testing REST API frameworks, currently only supporting JSON format. We don't have plans currently to add support for XML or SOAP formats, because they suck. But hey if you want to add it, that wouldn't be too hard!

