import { Command } from "commander";
import * as fs from "fs";
import { join } from "path";
import { FlagpoleExecution } from "../flagpoleexecution";
import { printHeader } from "./cli-helper";
import { Cli } from "./cli";

// Get version from package
const pkg = require("../../package.json");
const FLAGPOLE_VERSION = pkg.version;

// Initialize CLI
const program = new Command("flagpole").passCommandToAction(false);
// Set version
program.version(
  FLAGPOLE_VERSION,
  "-v, --version",
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
  .option("-o, --output <format>", "set output format", "console")
  .option("-q, --quiet", "silence all command line output", false)
  .option("-b, --base <domain>", "override base domain")
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
  Cli.log("", program.helpInformation()).exit(0);
});
// Help men
program.on("--help", () => {
  printHeader(true);
});

// Parse it
program.parseAsync(process.argv);
