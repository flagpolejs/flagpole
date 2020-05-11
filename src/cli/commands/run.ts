import { Command, CliCommandOption } from "../command";
import { Cli } from "../cli";
import { tsc } from "./build";
import { SuiteConfig } from "../../flagpoleconfig";
import prompts = require("prompts");
import { promptSelect, stringArrayToPromptChoices } from "../cli-helper";
import { FlagpoleExecution } from "../../flagpoleexecution";
import commander = require("commander");
import Ansi from "cli-ansi";
import { TestRunner } from "../testrunner";
import { lineToVerbosity } from "../../logging/verbosity";

export default class Run extends Command {
  public commandString = "run";
  public description = "run test suites";
  public helpCallback() {
    console.log("");
    console.log("Examples:");
    console.log("");
    console.log("flagpole run --build --all");
    console.log("flagpole run -t smoke");
    console.log("flagpole run -s browser/*");
    console.log("");
  }
  public options = [
    new CliCommandOption({
      flags: "--all",
      description: "run all tests",
      default: false,
    }),
    new CliCommandOption({
      flags: "-a, --async",
      description: "run test suites asynchronously",
      default: false,
    }),
    new CliCommandOption({
      flags: "-o, --output <format>",
      description: "set output format",
      default: "console",
    }),
    new CliCommandOption({
      flags: "-s, --suite <suite>",
      description: "run these test suites, supports wildcard",
    }),
    new CliCommandOption({
      flags: "-t, --tag <tag>",
      description: "run test suites with this tag",
    }),
    new CliCommandOption({
      flags: "--build",
      description: "build first",
    }),
    new CliCommandOption({
      flags: "--headed",
      description: "override tests to show a headful browser",
    }),
    new CliCommandOption({
      flags: "--headless",
      description: "override tests to keep browser headless",
    }),
  ];

  public async action(args: commander.Command) {
    if (args.headed || args.headless) {
      FlagpoleExecution.global.headless = !!args.headless || !args.headed;
    }
    if (args.output) {
      FlagpoleExecution.global.outputFormat = args.output;
    }
    // Build first
    if (!!args.build) {
      await tsc(false);
    }
    Cli.subheader("Run Test Suites");
    // Default is to run all
    const suitesInProject: SuiteConfig[] =
      FlagpoleExecution.global.config.getSuites() || [];
    let selectedSuites: SuiteConfig[] = suitesInProject;
    let tag: string = args.tag || "";
    let suiteNames: string[] = args.suite ? args.suite.split(",") : [];
    // If they didn't want to run all
    if (!args.all) {
      // If they didn't set a name or tag, ask them
      if (!suiteNames.length && !tag.length) {
        const whatToRun = await promptForWhatToRun();
        if (whatToRun === "By Tag") {
          tag = await promptForTag();
        } else if (whatToRun === "Choose Suites") {
          suiteNames = await promptForSuites(selectedSuites);
          if (suiteNames.length == 0) {
            selectedSuites = [];
          }
        } else if (whatToRun === "None") {
          selectedSuites = [];
        }
      }
      // Filter some
      selectedSuites = filterBySuiteName(selectedSuites, suiteNames);
      selectedSuites = filterByTag(selectedSuites, tag);
    }
    // Now run them
    if (selectedSuites.length) {
      if (FlagpoleExecution.global.shouldOutputToConsole) {
        Cli.log(
          "",
          selectedSuites.length === 1 ? "Running Suite:" : "Running Suites: ",
          selectedSuites
            .map((suite) => {
              return suite.name;
            })
            .join(", "),
          ""
        );
      }
      return runSuites(selectedSuites, !!args.async);
    }
    // None to run
    Cli.log("No tests selected to run.").exit(0);
  }
}

const filterBySuiteName = (
  selectedSuites: SuiteConfig[],
  suiteNames?: string[]
): SuiteConfig[] => {
  if (suiteNames && suiteNames.length > 0) {
    // Support wildcards and make case insensitive
    // They can use * and ?
    const regExes: RegExp[] = (() => {
      const regExes: RegExp[] = [];
      (suiteNames || []).forEach((name) => {
        const regexString = name.replace(".", ".").replace("*", ".*");
        regExes.push(new RegExp(`^${regexString}$`, "i"));
      });
      return regExes;
    })();
    // Now filter the list
    selectedSuites = selectedSuites.filter((suite) => {
      // See if any of the regular expressions match this suite
      return regExes.some((regEx) => {
        return regEx.test(suite.name);
      });
    });
  }
  return selectedSuites;
};

const filterByTag = (
  selectedSuites: SuiteConfig[],
  tag?: string
): SuiteConfig[] => {
  if (tag && tag.length) {
    selectedSuites = selectedSuites.filter((suite) => {
      return suite.tags.includes(tag);
    });
  }
  return selectedSuites;
};

const promptForWhatToRun = async (): Promise<
  "All" | "Choose Suites" | "By Tag" | "None"
> => {
  const response = await prompts(
    promptSelect(
      "run",
      "What tests do you want to run?",
      stringArrayToPromptChoices(["All", "Choose Suites", "By Tag", "None"]),
      0
    )
  );
  return response.run;
};

const promptForSuites = async (
  selectedSuites: SuiteConfig[]
): Promise<string[]> => {
  const response = await prompts({
    type: "multiselect",
    name: "suitesNames",
    message: "Which suites do you want to run?",
    choices: stringArrayToPromptChoices(
      selectedSuites.map((suite) => {
        return suite.name;
      })
    ),
  });
  return response.suitesNames || [];
};

const promptForTag = async (): Promise<string> => {
  const tags: string[] = FlagpoleExecution.global.config.getTags() || [];
  if (tags.length > 0) {
    const response = await prompts(
      promptSelect(
        "tag",
        "What tag do you want to run?",
        stringArrayToPromptChoices(tags)
      )
    );
    return response.tag;
  }
  return "";
};

const runSuites = async (
  selectedSuites: SuiteConfig[],
  asyncExecution: boolean
): Promise<void> => {
  // Add suites to our test runner
  const runner: TestRunner = new TestRunner();
  selectedSuites.forEach(function (suite: SuiteConfig) {
    runner.addSuite(suite);
  });

  // If console output, then give feedback
  if (FlagpoleExecution.global.shouldOutputToConsole) {
    // If no matching tests found to run
    if (runner.suites.length == 0) {
      Cli.log("Did not find any test suites to run.\n");
      Cli.exit(2);
    }
    if (FlagpoleExecution.global.volume >= lineToVerbosity["decoration"]) {
      Ansi.writeLine();
      const spinner = Cli.instance.spinner(
        `Loading ${runner.suites.length} test suites...`
      );
      runner.subscribe((message: string) => {
        spinner.updateMessage(message);
      });
      runner.after(() => {
        spinner.stop();
        Ansi.write(Ansi.eraseLines(2));
      });
    }
  }

  await runner.runSpawn(asyncExecution);

  // Adios
  Cli.exit(runner.exitCode);
};
