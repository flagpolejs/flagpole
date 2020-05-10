#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import { join } from "path";
import { printHeader } from "./cli-helper";
import { Cli } from "./cli";

// Get version from package
const pkg = require("../../package.json");
const FLAGPOLE_VERSION = pkg.version;

// Initialize CLI
const program = new Command("flagpole").passCommandToAction(false);
// Set verbosity level
const setVolume = (value: number | string = 50, defaultValue: number = 50) => {
  if (typeof value === "string") {
    if (value.startsWith("-") || value.startsWith("+")) {
      value = 50 + parseInt(value);
    } else if (value == "verbose" || value == "debug" || value == "loud") {
      value = 100;
    } else if (value == "normal" || value == "default") {
      value = 50;
    } else if (value == "quiet") {
      value = 30;
    } else if (value == "silent") {
      value = 0;
    } else {
      value = parseInt(value);
    }
  }
  return String(
    !isNaN(value)
      ? // Between 0 and 100
        Math.max(0, Math.min(100, value))
      : defaultValue
  );
};
// Set version
program.version(
  FLAGPOLE_VERSION,
  "-V, --version",
  "Output the current version of Flagpole CLI"
);
// Global arguments
program
  .option(
    "-c, --config <file>",
    "override the default file name of the config file",
    "flagpole.json"
  )
  .option(
    "-p, --project <path>",
    "override the default project folder",
    process.cwd()
  )
  .option("-e, --env <name>", "set the environment")
  .option("-b, --base <domain>", "override base domain")
  .option(
    "-v, --volume <level>",
    "set volume (verbosity) level beteen 0 and 100",
    (value) => {
      return setVolume(value);
    },
    process.env.VOLUME || "50"
  )
  .option("-x, --exitOnDone", "exit process after suites finish runs")
  .option("-z, --isChildProcess");
// Usage tips
program.usage("[command] [arguments]");
// Import commands
const files = fs.readdirSync(join(__dirname, "commands"));
files.forEach((file) => {
  if (file.endsWith(".js")) {
    const CliCommand = require(join(__dirname, "commands", file)).default;
    const command = new CliCommand();
    command.init(program);
  }
});
// When no command is entered
program.action(() => {
  printHeader(true);
  //Cli.log(program.helpInformation());
  Cli.log(`
  about                  credits
  add [type]             add a new suite, scenario, environment or tag
  audit                  find problems in Flagpole configuration, such as suites whose files do not exist
  build                  transpile tests from TypeScript to JavaScript
  debug                  give some debug information
  import                 find files in the tests folder that are not in Flagpole config and import them
  init                   initialize Flagpole in this project
  list [type]            list out the suites, environments or tags in this project
  rm [type]              remove a suite or environment
  run [options]          run test suites
  `);
  Cli.exit(0);
});
// Help men
program.on("--help", () => {
  printHeader(true);
});

// Parse it
program.parseAsync(process.argv);
