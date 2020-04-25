import { Cli } from "./cli";
import { SuiteConfig } from "./config";
import { TestRunner } from "./testrunner";
import { CliAnsi } from "./cli-ansi";
import { FlagpoleOutput, FlagpoleExecution } from "../flagpoleexecutionoptions";
import * as prompts from "prompts";
import {
  promptSelect,
  stringArrayToPromptChoices,
  printSubheader,
  printConsoleLine,
} from "./cli-helper";
import { build } from "./build";

const ansi = new CliAnsi();
const suitesInProject: SuiteConfig[] = Cli.config.getSuites();

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
  const response = await prompts(
    promptSelect(
      "tag",
      "What tag do you want to run?",
      stringArrayToPromptChoices(Cli.config.getTags())
    )
  );
  return response.tag;
};

export const run = async (
  suiteNames: string[],
  tag: string,
  runAll: boolean
): Promise<void> => {
  if (Cli.commandArg === "build") {
    await build(false);
  }
  printSubheader("Run Test Suites");
  // Default is to run all
  let selectedSuites: SuiteConfig[] = suitesInProject;
  // If they didn't want to run all
  if (!runAll) {
    // If they didn't set a name or tag, ask them
    if (!suiteNames.length && !tag.length) {
      const whatToRun = await promptForWhatToRun();
      if (whatToRun === "By Tag") {
        tag = await promptForTag();
      } else if (whatToRun === "Choose Suites") {
        suiteNames = await promptForSuites(selectedSuites);
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
    printConsoleLine(
      "Running Suites: " +
        selectedSuites
          .map((suite) => {
            return suite.name;
          })
          .join(", ")
    );
    return runSuites(selectedSuites);
  }
  // None to run
  printConsoleLine("No tests selected to run.");
  Cli.exit(0);
};

const runSuites = async (selectedSuites: SuiteConfig[]): Promise<void> => {
  // Add suites to our test runner
  const runner: TestRunner = new TestRunner();
  selectedSuites.forEach(function (suite: SuiteConfig) {
    runner.addSuite(suite);
  });

  // If console output, then give feedback
  if (FlagpoleExecution.opts.output == FlagpoleOutput.console) {
    // If no matching tests found to run
    if (runner.suites.length == 0) {
      Cli.log("Did not find any test suites to run.\n");
      Cli.exit(2);
    }

    ansi.writeLine();

    const states = ["/", "—", "\\", "|"];
    let stateIndex: number = 0;
    let statusMessage: string = `Loading ${runner.suites.length} test suites...`;
    let timer = setInterval(() => {
      ansi.writeLine(
        ansi.cursorUp(),
        ansi.eraseLine(),
        `${states[stateIndex]} ${statusMessage}`
      );
      stateIndex = stateIndex < states.length - 1 ? stateIndex + 1 : 0;
    }, 100);

    runner.subscribe((message: string) => {
      statusMessage = message;
    });

    await runner.runSpawn();

    clearInterval(timer);
    ansi.write(ansi.eraseLines(2));
  }
  // If other output, just give final out
  else {
    await runner.runSpawn();
  }

  // Adios
  Cli.exit(runner.exitCode);
};
