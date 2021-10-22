import { Command, CliCommandOption } from "../command";
import { FlagpoleExecution } from "../../flagpoleexecution";
import prompts = require("prompts");
import {
  promptSelect,
  promptTextName,
  promptMultiSelect,
  stringArrayToPromptChoices,
  promptUrl,
  promptTextDescription,
  promptTextPath,
  promptList,
} from "../cli-helper";
import { Cli, addScenario, addSuite } from "../cli";
import commander = require("commander");

const typesOfTest: any[] = [
  {
    title: "REST API/JSON",
    value: "json",
  },
  {
    title: "HTML Page/DOM",
    value: "html",
  },
  {
    title: "Browser (Puppeteer)",
    value: "browser",
  },
  {
    title: "XML",
    value: "xml",
  },
  {
    title: "RSS Feed",
    value: "rss",
  },
  {
    title: "Atom Feed",
    value: "atom",
  },
  {
    title: "ExtJS",
    value: "extjs",
  },
  {
    title: "HLS Video Stream",
    value: "hls",
  },
];

const choicesOfType = [
  { value: "suite", title: "Suite" },
  { value: "scenario", title: "Scenario" },
  { value: "env", title: "Environment" },
  { value: "tag", title: "Tag" },
];

export default class Add extends Command {
  public commandString = "add [type]";
  public description = "add a new suite, scenario, environment or tag";
  public options = [
    new CliCommandOption({
      flags: "-l, --label <name>",
      description: "label to add",
    }),
    new CliCommandOption({
      flags: "-u, --url <url>",
      description: "url to add",
    }),
  ];
  public async action(type: string, args: { [key: string]: string }) {
    if (!type || !choicesOfType.map((choice) => choice.value).includes(type)) {
      type = await askForType();
    }
    if (type == "tag") {
      promptToAddTag(args);
    } else if (type == "env") {
      return args.label && args.url
        ? addEnv(args.label, args.url)
        : promptToAddEnv(args);
    } else if (type == "scenario") {
      promptToAddScenario(args);
    } else {
      promptToAddSuite(args);
    }
  }
}

const askForType = async (): Promise<string> => {
  return (
    await prompts(
      promptSelect("thingToAdd", "What do you want to add?", choicesOfType, 0)
    )
  ).thingToAdd;
};

function addEnv(name: string, url: string) {
  FlagpoleExecution.global.config.addEnvironment({
    name: name,
    defaultDomain: url,
  });
  return FlagpoleExecution.global.config.save();
}

async function promptToAddEnv(args: { [key: string]: string }) {
  const responses = await prompts([
    promptTextName(
      "name",
      "What do you want to call the environment?",
      args.label
    ),
    promptUrl("url", "Default Domain (optional)", args.url),
  ]);
  return addEnv(responses.name, responses.url);
}

async function promptToAddTag(args: { [key: string]: string }) {
  const responses = await prompts([
    promptTextName("tag", "Tag to Add", args.label),
    promptMultiSelect(
      "suites",
      "Suites to apply it to",
      stringArrayToPromptChoices(
        FlagpoleExecution.global.config.getSuiteNames().sort()
      )
    ),
  ]);
  FlagpoleExecution.global.config.addTagToSuite(
    responses.suites,
    responses.tag
  );
  await FlagpoleExecution.global.config.save();
}

async function promptToAddScenario(args: { [key: string]: string }) {
  const suites = stringArrayToPromptChoices(
    FlagpoleExecution.global.config.getSuiteNames().sort()
  );

  if (suites?.length == 0) {
    Cli.log(
      "",
      "You have not created any test suites yet. You should do that first.",
      "",
      "To add a test suite:",
      "flagpole add suite",
      ""
    );
    Cli.exit(1);
  }

  const responses = await prompts([
    promptSelect("suite", "What suite do you want to add it to?", suites),
    promptSelect("type", "What type of test is this scenario?", typesOfTest, 0),
    promptTextDescription(
      "scenarioDescription",
      "Description of Scenario",
      "Some Other Page Loads"
    ),
    promptTextPath(
      "scenarioPath",
      "Scenario Start Path",
      args.url || "/some-other-page"
    ),
  ]);

  const suite = FlagpoleExecution.global.config.getSuite(responses.suite);
  if (!suite) {
    return Cli.log(`Invalid suite: ${responses.suite}`, "").exit(1);
  }

  await addScenario(suite, {
    description: responses.scenarioDescription,
    path: responses.scenarioPath,
    type: responses.type,
  });

  Cli.log(
    "Appended new scenario to suite:",
    suite.getSourcePath(),
    "",
    "Scenario added to that suite:",
    responses.scenarioDescription,
    ""
  );
}

async function promptToAddSuite(args: { [key: string]: string }) {
  Cli.subheader("Add New Suite");
  const standardQuestions = await prompts([
    promptTextName("suiteName", "Name of Suite", args.label || "smoke"),
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
    promptSelect("type", "What type of test is this scenario?", typesOfTest, 0),
    promptTextPath("scenarioPath", "Scenario Start Path", args.url || "/"),
    promptList("tags", "Add Tags (Optional, Space Delimited)"),
  ]);

  // If they answered all the required questions
  if (
    standardQuestions.suiteName &&
    standardQuestions.suiteDescription &&
    standardQuestions.scenarioDescription &&
    standardQuestions.type &&
    standardQuestions.scenarioPath
  ) {
    await addSuite(
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

    Cli.log("", "Created new test suite.")
      .list(
        "Suite file created: " + standardQuestions.suiteName,
        "Scenario added: " + standardQuestions.scenarioDescription,
        "Config file updated"
      )
      .log("")
      .exit(0);
  }
  // Did not answer all questions
  else {
    Cli.log("", "No suite created.", "").exit(0);
  }
}
