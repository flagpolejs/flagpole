# Further Setup

## Installing other dependencies

In order to keep the core library relatively trim, we don't want to ship Flagpole with some dependencies that you might not use. So where possible we have left them out and load them dynamically if present.

### Puppeteer

If you are going to do full browser testing, you will probably want to install [Puppeteer](https://pptr.dev/) in your project install it as well, as a dev dependency.

```cli
npm i puppeteer --save-dev
```

### TypeScript

Writing tests with TypeScript is possible. During `flagpole init` the CLI will ask if you want to use TypeScript:

> Do you want Flagpole to use TypeScript?

Selecting yes will prompt you for source and output directories. The default setup looks like this:

```
tests/
  cache/
  images/
  out/
  reports/
  scehmas/
  src/
  tsconfig.json
```

You can then compile your suites like so:

```
flagpole build
flagpole run --all
```

or

```
flagpole run --build --all
```

If you want to instead build your tests with the rest of your TypeScript app, you may do so as such:

```
"path": "/",
"source": "src/tests",
"output": "dist/tests",
```

Then rely on your project's `tsconfig.json` to compile from `src/` to `dist/`

Note: TypeScript version >= 4.2.3 is required.
