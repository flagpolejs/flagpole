import {
  printHeader,
  printSubheader,
  trimInput,
  stringArrayToPromptChoices,
  promptTextName,
  promptTextDescription,
  promptSelect,
  promptList,
  promptTextPath,
} from "./cli-helper";
import { Cli } from "./cli";
import { SuiteConfig } from "./config";
import * as prompts from "prompts";

const typesOfTest: any[] = [
  { title: "HTML Page", value: "html" },
  {
    title: "REST API (JSON Format)",
    value: "json",
  },
  {
    title: "Browser (Puppeteer)",
    value: "browser",
  },
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
    promptTextName("suiteName", "Name of Suite", Cli.commandArg2 || "smoke"),
    promptTextDescription(
      "suiteDescription",
      "Description of Suite",
      "Basic Smoke Test of Site"
    ),
    promptTextDescription(
      "scenarioDescription",
      "First Scenario",
      "Homepage Loads"
    ),
    promptSelect(
      "type",
      "What type of test is this scenario?",
      typesOfTest,
      true,
      0
    ),
    promptTextPath("scenarioPath", "Scenario Start Path", "/"),
    promptList("tags", "Add Tags (Optional, Space Delimited)"),
  ]);

  Cli.log("");
  await Cli.addSuite(
    {
      name: standardQuestions.suiteName,
      description: standardQuestions.suiteDescription,
      tags: standardQuestions.tags,
    },
    {
      description: standardQuestions.scenarioDescription,
      type: standardQuestions.type,
      path: standardQuestions.scenarioPath,
    }
  );

  Cli.log("Created new test suite.");
  Cli.list([
    "Suite file created: " + standardQuestions.suiteName,
    "Scenario added: " + standardQuestions.scenarioDescription,
    "Config file updated",
  ]);
  Cli.log("");
  Cli.exit(0);
}

async function addScenario() {
  printSubheader("Add New Scenaio");

  const suites = stringArrayToPromptChoices(Cli.config.getSuiteNames().sort());

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
    promptSelect(
      "suite",
      "What suite do you want to add it to?",
      suites,
      true,
      Cli.commandArg2 || ""
    ),
    promptSelect(
      "type",
      "What type of test is this scenario?",
      typesOfTest,
      true,
      0
    ),
    promptTextDescription(
      "scenarioDescription",
      "Description of Scenario",
      "Some Other Page Loads"
    ),
    promptTextPath("scenarioPath", "Scenario Start Path", "/some-other-page"),
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
    type: responses.type,
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
      validate: function (input) {
        return /^[a-z0-9]{1,12}$/i.test(input);
      },
    },
    {
      type: "text",
      name: "defaultDomain",
      message: "Default Domain (optional)",
      format: trimInput,
    },
  ]);

  Cli.config.addEnvironment({
    name: responses.name,
    defaultDomain: responses.defaultDomain,
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
      validate: (tag) => {
        return /^[a-z][a-z0-9_-][a-z0-0]+$/i.test(tag)
          ? true
          : "Tag should be a single alpha-numeric word";
      },
      format: trimInput,
    },
    {
      type: "multiselect",
      name: "suites",
      min: 1,
      message: "Suites to apply it to",
      choices: stringArrayToPromptChoices(Cli.config.getSuiteNames().sort()),
    },
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
          { value: "tag", title: "Tag" },
        ],
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
