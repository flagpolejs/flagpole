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
      hint: "You can easily add more later",
      initial: "dev",
      min: 1,
      max: 8,
      choices: [
        { value: "dev", title: "dev" },
        { value: "stag", title: "stag" },
        { value: "prod", title: "prod" },
        { value: "preprod", title: "preprod" },
        { value: "qa", title: "qa" },
        { value: "local", title: "local" },
        { value: "alpha", title: "alpha" },
        { value: "beta", title: "beta" }
      ],
      validate: function (input) {
        return input.length > 0;
      }
    }]);

  const domainPrompts: prompts.PromptObject[] = [];
  initialResponses.env.forEach((env: string) => {
    domainPrompts.push({
      type: "text",
      name: `domain_${env}`,
      message: `Default Domain for ${env}`,
      format: trimInput,
      validate: domain => {
        return /^https?:\/\/[a-z][a-z0-9_.-]+[a-z](:[0-9]+)?(\/.*)?$/i.test(domain) ?
          true : 'Must be a valid URL, starting with http:// or https://'
      }
    });
  });
  const domains = await prompts(domainPrompts);

  const tsResponse = await prompts(
    {
      type: "toggle",
      name: "useTypeScript",
      message: "Do you want Flagpole to use TypeScript?",
      initial: true,
      active: "Yes",
      inactive: "No"
    }
  );

  const rootFolder = await prompts({
    type: "text",
    name: "path",
    message: tsResponse.useTypeScript
      ? "What is the root subfolder you want to put your tests in? (tsconfig.json will go here)"
      : "What subfolder do you want to put your tests in?",
    initial: "tests",
    format: trimInput
  });

  let tsFolders: undefined | prompts.Answers<string> = undefined;
  if (tsResponse.useTypeScript) {
    tsFolders = await prompts([
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
      source: tsFolders == undefined ? undefined : tsFolders.sourceFolder,
      output: tsFolders == undefined ? undefined : tsFolders.outputFolder
    },
    environments: ((): iEnvOpts[] => {
      const out: iEnvOpts[] = [];
      initialResponses.env.forEach((env: string) => {
        out.push({
          name: env,
          defaultDomain: domains[`domain_${env}`]
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
