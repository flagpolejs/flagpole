import { printSubheader, printHeader, trimInput } from "./cli-helper";
import { Cli } from "./cli";
import { iConfigOpts, iEnvOpts } from "./config";
import * as prompts from "prompts";

export async function init() {
  printHeader();
  printSubheader("Initialize Flagpole Project");

  const initialResponses = await prompts([
    {
      type: "text",
      name: "project",
      message: "What is the name of your project?",
      initial: process
        .cwd()
        .split("/")
        .pop(),
      format: trimInput
    },
    {
      type: "multiselect",
      name: "env",
      message: "What environments do you want to support?",
      initial: 0,
      choices: [
        { value: "dev", title: "dev" },
        { value: "stag", title: "stag" },
        { value: "stag", title: "stag" },
        { value: "qa", title: "qa" },
        { value: "qa", title: "qa" },
        { value: "qa", title: "qa" },
        { value: "alpha", title: "alpha" },
        { value: "beta", title: "beta" }
      ],
      validate: function(input) {
        return input.length > 0;
      }
    },
    {
      type: "toggle",
      name: "useTypeScript",
      message: "Do you want Flagpole to use TypeScript?",
      initial: true,
      active: "Yes",
      inactive: "No"
    }
  ]);

  const rootFolder = await prompts({
    type: "text",
    name: "path",
    message: initialResponses.useTypeScript
      ? "What is the root subfolder you want to put your tests in? (tsconfig.json will go here)"
      : "What subfolder do you want to put your tests in?",
    initial: "tests",
    format: trimInput
  });

  let tsResponses: undefined | prompts.Answers<string> = undefined;
  if (initialResponses.useTypeScript) {
    tsResponses = await prompts([
      {
        type: "text",
        name: "sourceFolder",
        message: `Source Folder ${rootFolder.path}/`,
        initial: `src`
      },
      {
        type: "text",
        name: "outputFolder",
        message: `Output Folder ${rootFolder.path}/`,
        initial: `out`
      }
    ]);
  }

  const configOptions: iConfigOpts = {
    configPath: `${process.cwd()}/flagpole.json`,
    project: {
      name: initialResponses.project,
      path: rootFolder.path,
      source: tsResponses == undefined ? undefined : tsResponses.sourceFolder,
      output: tsResponses == undefined ? undefined : tsResponses.outputFolder
    },
    environments: ((): iEnvOpts[] => {
      const out: iEnvOpts[] = [];
      initialResponses.env.forEach(env => {
        out.push({
          name: env,
          defaultDomain: ""
        });
      });
      return out;
    })(),
    suites: []
  };
  Cli.hideBanner = true;
  Cli.log("Creating your Flagpole project...");
  Cli.init(configOptions)
    .then((tasks: string[]) => {
      Cli.log("");
      Cli.list(tasks);
      Cli.log("");
      Cli.log("Your Flagpole project was created.");
      Cli.exit(0);
    })
    .catch((err: string) => {
      Cli.log(err);
      Cli.exit(1);
    });
}
