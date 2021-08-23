# What is Flagpole?

_"Let me run it up the flagpole first"_

Running something up the flagpole means you check on it first to see if it's good before going forward. And that's exactly what this framework is about, so we like the analogy.

Flagpole is a flexible framework that can support a number of different types of testing:

- Full browser testing with Puppeteer
- Super-fast HTML DOM testing with Cheerio (jQuery for Node)
- REST API/JSON End Points with Schema Snapshots
- Lightweight image tester that can verify the dimensions, mime and file size without downloading the whole thing
- Basic validation for other resources like Stylesheets, JavaScript
- Visual comparisons of a screenshot against a control image
- Generic XML
- RSS or Atom feeds

Flagpole is designed to be simple so that the most junior engineer or QA analyst can pick it up within hours.

Flagpole is designed for portability, so that you can run it locally within your repository from a githook, in the cloud when something is deployed, as a scheduled job, or manually any time you want.

Flagpole has a rich CLI that can be used to list tests, run tests, create new suites or scenarios, etc.
