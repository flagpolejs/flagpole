# CLI

## Commands

### about

Gives some information about Flagpole and its contributors.

```bash
flagpole about
```

### add env

Allows you to add a new environment. Environments are things like dev, staging, and prod. Each environment in a suite can have its own domain base, which allows you to use the same tests across environments easily.

```bash
flagpole add env
```

### add scenario

Adds a new scenario to a suite. If you have no suites set up yet, this will fail. If you have multiple suites, it will ask you which on you want to add the new scenario to.

This method will go into the suite file and add the code. Of course you can add this code manually, but this just gives you a template to start with.

```bash
flagpole add scenario
```

### add suite

Adds a new suite to the project. This will create the suite file and add in the base code. Of course you can add this all manually, but this just gives you a template to start with.

```bash
flagpole add suite
```

### audit

This will show you any suites you have referenced in `flagpole.json` whose corresponding files no longer exist in the text folder. This allows you to do a manual clean up. Hoping to add more functionality here in the future to automatically do some work for you to clean it.

```bash
flagpole audit
```

### deploy

In the future there will be a web based control panel where you can view, manage and run your tests in the cloud. This feature is not available in 2.0 but maybe in 3.0!

```bash
flagpole deploy
```

### import suite

If you created or dropped some .js suite files into the tests folder without going through the CLI, this allows you to officially import them into the project.

```bash
flagpole import suite
```

### init

Initializes flagpole to set it up in the current project folder.

```bash
flagpole init
```

### list

Lists out all of the suites available in this project.

```bash
flagpole list
```

You can list out environments with:

```bash
flagpole list env
```

Or list tags

```bash
flagpole list tags
```

### login

In the future there will be a web based control panel where you can view, manage and run your tests in the cloud. This feature is not available in 2.0 but maybe in 3.0!

```bash
flagpole login
```

### logout

In the future there will be a web based control panel where you can view, manage and run your tests in the cloud. This feature is not available in 2.0 but maybe in 3.0!

```bash
flagpole logout
```

### pack

Puts your test suites and project files into a zip file so that they can be copied to something else.

```bash
flagpole pack
```

### rm env

Allows you to remove an environment from the project. This will remove it from the config, but will not modify your existing suite that reference it.

```bash
flagpole rm env
```

### rm suite

Allows you to remove a suite from the project. This will remove it from the config and delete the file

```bash
flagpole rm suite
```

### run

Runs your test suites. With no switches like this. it will run every one of the tests. Running this command with no argments will give you a prompt on which tests you would like to run.

```bash
flagpole run
```

#### --all

Run all test suites.

```bash
flagpole run --all
```

#### -a

Tells Flagpole to run in asynchronous exeuction mode. This means all suites fire off in parallel, instead of one at a time. This can greatly speed up the overall execution time of all tests.

```bash
flagpole run -a
```

#### -e environmentName

Specifies the environment name, which will be the context that the tests execute with.

```bash
flagpole run -e staging
```

#### -o outputType

Specifies that type of output you want Flagpole to create. The defualt is this pretty colored console ASCII text. But there are other options:

- browser - Formats it into HTML and opens it in your default web browser after
- console - Default
- csv - Comma separated
- html - Outputs HTML to the console
- json - JSON formatted
- psv - Pipe separated
- text - Same as default but without the ASCII colors
- tsv - Tab separated

```bash
flagpole run -o browser
```

#### -s suiteName

Specifies a certain suite or suites to run.

```bash
flagpole run -s smoke
```

You can list out multiple suites, comma separated.

```bash
flagpole run -s smoke,api,e2e
```

Or you can use a wildcard to match tests matching a pattern or in a certain folder:

```bash
flagpole run -s browser/*
```

#### -t tagName

Run all suites with the given tag. This can only be a single string value.

```bash
flagpole run -t basic
```

### run build

This is the same as run (it supports all of the same arguments), except that it will build your TypeScript tests first.

```bash
flagpole run --build
```

This combines the "run" and "build" commands, much like this would do:

```bash
flagpole build && flagpole run
```

### watch

Starts a file watcher that looks for changes in the Flagpole source folder. If any file changes, it will automatically run `flagpole build` to re-transpile the tests.

```bash
flagpole watch
```

## General Switches

### -c pathToConfig

By default Flagpole looks for flagpole.json file in the current folder as the project config. But you can use this switch to tell it to look elsewhere.

```bash
flagpole run -c /path/to/flagpole.json
```

### -h

Hides the ASCII banner graphic.

```bash
flagpole run -h
```

### -q

Quiet mode. Silences all Flagpole command line output. This is useful when you don't want to capture what it has to say, you just want to know if it passed or failed. Which a script running this could get from the exit code of 0 or 1.

```bash
flagpole run -q
```

### -v

Prints out simply what version of Flagpole CLI is installed.

```bash
flagpole -v
```
