import {
  printHeader,
  printSubheader,
  trimInput,
  stringArrayToPromptChoices
} from "./cli-helper";
import { Cli } from "./cli";
import { SuiteConfig } from "./config";
import * as prompts from "prompts";

const typesOfTest: any[] = [
  { title: "HTML Page", value: "html" },
  {
    title: "REST API (JSON Format)",
    value: "json"
  },
  {
    title: "Browser (Puppeteer)",
    value: "browser"
  }
];

const canAdd: string[] = ["suite", "scenario", "env", "tag"];

async function addSuite() {
  printSubheader("Add New Suite");

  if (!Cli.config.isValid()) {
    Cli.log("Config file is invalid.");
    Cli.exit(1);
  }

  // Standard questions
  const standardQuestions = await prompts([
    {
      type: "text",
      name: "suiteName",
      message: "Name of Suite",
      initial: Cli.commandArg2 || "smoke",
      format: trimInput,
      validate: function(input) {
        return /^[a-z0-9][a-z0-9/\/_-]{1,62}[a-z0-9]$/i.test(input);
      }
    },
    {
      type: "text",
      name: "suiteDescription",
      message: "Description of Suite",
      initial: "Basic Smoke Test of Site",
      format: trimInput,
      validate: function(input) {
        return /^[a-z0-9].{1,63}$/i.test(input);
      }
    },
    {
      type: "text",
      name: "scenarioDescription",
      message: "First Scenario",
      initial: "Homepage Loads",
      format: trimInput,
      validate: function(input) {
        return /^[a-z0-9].{1,63}$/i.test(input);
      }
    },
    {
      type: "select",
      name: "type",
      message: "What type of test is this scenario?",
      initial: 0,
      choices: typesOfTest
    },
    {
      type: "text",
      name: "scenarioPath",
      message: "Scenario Start Path",
      initial: "/",
      format: trimInput,
      validate: function(input) {
        return /^\/.{0,63}$/i.test(input);
      }
    },
    {
      type: "list",
      name: "tags",
      message: "Add Tags (Optional)",
      initial: "",
      // @ts-ignore
      separator: " "
    }
  ]);

  Cli.log("");
  await Cli.addSuite(
    {
      name: standardQuestions.suiteName,
      description: standardQuestions.suiteDescription,
      tags: standardQuestions.tags
    },
    {
      description: standardQuestions.scenarioDescription,
      type: standardQuestions.type,
      path: standardQuestions.scenarioPath
    }
  );

  Cli.log("Created new test suite.");
  Cli.list([
    "Suite file created: " + standardQuestions.suiteName,
    "Scenario added: " + standardQuestions.scenarioDescription,
    "Config file updated"
  ]);
  Cli.log("");
  Cli.exit(0);
}

async function addScenario() {
  printSubheader("Add New Scenaio");

  const suites = stringArrayToPromptChoices(Cli.config.getSuiteNames());

  if (suites.length == 0) {
    Cli.log("");
    Cli.log(
      "You have not created any test suites yet. You should do that first."
    );
    Cli.log("");
    Cli.log("To add a test suite:");
    Cli.log("flagpole add suite");
    Cli.log("");
    Cli.exit(1);
  }

  const responses = await prompts([
    {
      type: "select",
      name: "suite",
      message: "What suite do you want to add it to?",
      initial: Cli.commandArg2 || "",
      choices: suites,
      validate: function(input) {
        return input.length > 0;
      }
    },
    {
      type: "select",
      name: "type",
      message: "What type of test is this scenario?",
      initial: 0,
      choices: typesOfTest
    },
    {
      type: "text",
      name: "scenarioDescription",
      message: "Description of Scenario",
      initial: "Some Other Page Loads",
      format: trimInput,
      validate: function(input) {
        return /^[a-z0-9].{1,63}$/i.test(input);
      }
    },
    {
      type: "text",
      name: "scenarioPath",
      message: "Scenario Start Path",
      initial: "/some-other-page",
      format: trimInput,
      validate: function(input) {
        return /^\/.{0,63}$/i.test(input);
      }
    }
  ]);

  const suite: SuiteConfig = Cli.config.suites[responses.suite];
  if (!suite) {
    Cli.log(`Invalid suite: ${responses.suite}`);
    Cli.log("");
    Cli.exit(1);
  }

  await Cli.addScenario(suite, {
    description: responses.scenarioDescription,
    path: responses.scenarioPath,
    type: responses.type
  });

  Cli.log("Appended new scenario to suite:");
  Cli.log(suite.getSourcePath());
  Cli.log("");
  Cli.log("Scenario added to that suite:");
  Cli.log(responses.scenarioDescription);
  Cli.log("");
  Cli.exit(0);
}

async function addEnv() {
  printSubheader("Add New Environment");
  const responses = await prompts([
    {
      type: "text",
      name: "name",
      message: "What do you want to call the environment?",
      initial: Cli.commandArg2 || "",
      validate: function(input) {
        return /^[a-z0-9]{1,12}$/i.test(input);
      }
    },
    {
      type: "text",
      name: "defaultDomain",
      message: "Default Domain (optional)",
      format: trimInput
    }
  ]);

  Cli.config.addEnvironment({
    name: responses.name,
    defaultDomain: responses.defaultDomain
  });
  await Cli.config.save();
  Cli.log("Added new environment.");
  Cli.list(["Config file updated"]);
  Cli.log("");
  Cli.exit(0);
}

async function addTag() {
  const responses = await prompts([
    {
      type: "text",
      name: "tag",
      message: "Tag to Add",
      validate: tag => {
        return /^[a-z][a-z0-9_-][a-z0-0]+$/i.test(tag)
          ? true
          : "Tag should be a single alpha-numeric word";
      },
      format: trimInput
    },
    {
      type: "multiselect",
      name: "suites",
      min: 1,
      message: "Suites to apply it to",
      choices: stringArrayToPromptChoices(Cli.config.getSuiteNames())
    }
  ]);

  responses.suites.forEach((suiteName: string) => {
    Cli.config.suites[suiteName].addTag(responses.tag);
  });
  Cli.config.save();
}

export async function add() {
  Cli.hideBanner = true;
  printHeader();

  let type: string = Cli.commandArg || "";

  if (!canAdd.includes(type)) {
    type = (
      await prompts({
        type: "select",
        name: "thingToAdd",
        message: "What do you want to add?",
        choices: [
          { value: "suite", title: "Suite" },
          { value: "scenario", title: "Scenario" },
          { value: "env", title: "Environment" },
          { value: "tag", title: "Tag" }
        ]
      })
    ).thingToAdd;
  }

  if (type == "scenario") {
    addScenario();
  } else if (type == "env") {
    addEnv();
  } else if (type == "tag") {
    addTag();
  } else {
    addSuite();
  }
}
