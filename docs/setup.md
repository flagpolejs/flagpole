# Further Setup

## Installing other dependencies

In order to keep the core library relatively trim, we don't want to ship Flagpole with some dependencies that you might not use. So where possible we have left them out and load them dynamically if present.

### Puppeteer

If you are going to do full browser testing, you will probably want to install [Puppeteer](https://pptr.dev/) in your project install it as well, as a dev dependency.

```cli
npm i puppeteer --save-dev
```

### JMESpath

Flagpole ships with a very slim JSON selector capabilities with basic dot notation only. But if you're planning to dive deep into API testing you'll probably want something more capable.

[JMESpath](http://jmespath.org/) is a very powerful tool for querying complex JSON repsonses. If you want to use this, simply install it like so:

```cli
npm i jmespath --save-dev
```

### AJV

AJV is a popular library that supports an emerging standard of JSON schema definitions. Flagpole comes with a simple JSON Schema validator, which is mostly compatible with AJV (but not as feature rich). The Flagpole library is probably good enough most of the time and has some nice features built in that makes schemas a little simpler to define.

However, if you want the full power of AJV then just install it. Flagpole will automatically recognize that it's there and use it.

```cli
npm i ajv --save-dev
```

