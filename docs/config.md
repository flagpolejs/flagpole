# Configuration File: flagpole.json

When you initialize Flagpole with `flagpole init` it automatically creates the `flagpole.json` file for you. Currently, there is very little to it and you probably never need to mess with it manually. Its use may grow in the future, so this is kind of a stub. But here's how it might look:

```javascript
{
  "project": {
    "id": "89FlnTVjMEb5ZhUkovPt",
    "name": "flagpole",
    "path": "tests"
  },
  "environments": {
    "dev": {
      "name": "dev",
      "defaultDomain": ""
    }
  },
  "suites": {
    "smoke": {
      "name": "smoke"
    }
  }
}
```

## project

This contains the basic information about your project.

### id

This property is not currently used in production, it will be a reference to your project's id once there is a Flagpole service in the cloud.

### name

Just a user friendly name for this project, often it's the name of your folder and probably the same as your project's name in your package.json

### path

The relative path to where your test suites live.

## environments

Flagpole can support multiple environments like dev, stag, and prod. This property is an object of environments that you've configured. At least one is required. The key of this object is the unique name of this environment. This should be short and sweet. It will also be what you type in at the command line to select which environment you want your suite to run against.

### name

Whatever you want to call it as a friendly name. By default it's the same as the key, but it can be changed to something else.

### defauldDomain

When you add a new suite with `flagpole add suite` it will use whatever you have here as the default domain so that you don't have to type it each time.

## suites

This is the actual test suites. You can have files in your tests folder that are not suites. So this defines them. The key of this object is the name of the suite, which will be what you type in as the `-s suiteName` switch when you run specific suites only.

More properties will be added to this in the future.

### name

By default this is the same as the key, but you could change it to something else if you really felt motivated.

