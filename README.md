# Flagpole JS

_"Let me run it up the flagpole first"_

Running something up the flagpole means you check on it first to see if it's good before going forward. And that's exactly what this framework is about, so we like the analogy.

_"Swiss army knife of end-to-end QA testing"_

Flagpole is a QA testing framework that is easy to learn, flexible, portable, and fast. How can Flagpole be do so many things well? We don't try to build everything from scratch, Flagpole leverages the best tools in the business and puts them under one roof in a consistent interface.

It supports a number of different types of testing:

- Full browser testing with Puppeteer
- Super-fast HTML DOM testing with Cheerio (jQuery for Node)
- REST API/JSON End Points with Schema Snapshots and validation of JSON Schema and JSON Type Definition (JTD) schemas
- Lightweight image tester that can verify the dimensions, mime and file size without downloading the whole thing
- Basic validation for other resources like Stylesheets, JavaScript
- Visual comparisons of a screenshot against a control image
- Generic XML
- RSS or Atom feeds

Flagpole is designed to be simple so that the most junior engineer or QA analyst can pick it up within hours. But it is so powerful it can take years to master and satisfy the most senior engineer.

Flagpole is designed for portability, so that you can run it locally within your repository from a githook, in the cloud when something is deployed, as a scheduled job, or manually any time you want.

Flagpole has a rich CLI that can be used to list tests, run tests, create new suites or scenarios, etc.

## Documentation

[Flagpole Docs](https://flagpolejs.github.io/flagpole)

[Example Test Scenarios](https://github.com/flocasts/flagpole/tree/master/tests)

## Flagpole Users

![FloSports](https://image.roku.com/developer_channels/prod/aa6d6ce57121b577c4115fe93d54778cebda85e793bf306bcecf1d638a470514.png)

![Echelon Fitness](https://www.northcastlepartners.com/wp-content/uploads/2019/08/Echelon_MainLogo_Registered@3x-100.jpg)

## Want to contribute?

Sure! Please contribute your pull request.

### Developer Style Guide

- Class is ordered: public properties, private/protected properties, constructor, public methods, private/protected methods
- Private/protected properties and methods are prefixed with \_
- Camel-case all the things, except class names and enums
- Interfaces are prefixed by i
- Think about the developer experience of the person writing the tests first and foremost
- Definitively type whenever possible
- Favor readability over cleverness or brevity
- Document and comment liberally
- Don't try to do everything, but do the common QA functions really well
- As much as possible, create a common experience across different classes of scenarios
- Keep the framework as light as possible, which might mean auto-discovery and dynamically loading optional libraries
- It should be obvious. It should not mislead, confuse, or cause additional cognitive load
- Do what you say, say what you do. No side effects.
- Try to start methods with verbs unless it's just really short, sweet, and obvious not to
- Start properties or methods that return booleans with "is" or "has" or "can" or something similar that reads what it is
- Start methods that convert an object to a different type with "to" like "toArray"
- Some things are designed to be chained, such as setting up a Suite or Scenario, so allow this to be chained by returning themselves, but don't chain just for the sake of chaining. Chain of readability and convenience of DX only.
