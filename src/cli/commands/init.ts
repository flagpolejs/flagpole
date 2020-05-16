import { Command } from "../command";
import { Cli } from "../cli";
import { FlagpoleExecution } from "../../flagpoleexecution";
import prompts = require("prompts");
import {
  promptTextName,
  promptMultiSelect,
  promptUrl,
  promptToggle,
  promptTextPath,
} from "../cli-helper";
import { sep } from "path";
import {
  iConfigOpts,
  FlagpoleConfig,
  iEnvCollection,
} from "../../flagpoleconfig";
import * as fs from "fs-extra";

export default class Init extends Command {
  public commandString = "init";
  public description = "initialize Flagpole in this project";
  public async action() {
    Cli.subheader("Initialize Flagpole Project");
    const opts = await getConfigOpts();
    Cli.log("Creating your Flagpole project...");
    const configFile: FlagpoleConfig = new FlagpoleConfig(
      opts,
      FlagpoleExecution.global.config.getConfigPath() || process.cwd()
    );
    await fs.ensureDir(configFile.getConfigFolder());
    await fs.ensureDir(configFile.getRootFolder());
    await fs.ensureDir(configFile.getCacheFolder());
    await fs.ensureDir(configFile.getImagesFolder());
    await configFile.save();
    if (configFile.project.isTypeScript) {
      await configFile.writeTsConfig();
      await fs.ensureDir(configFile.getTestsFolder());
      await fs.ensureDir(configFile.getSourceFolder());
    }
    Cli.log("", "Your Flagpole project was created.").exit(0);
  }
}

async function getConfigOpts(): Promise<iConfigOpts> {
  const projectName = await promptForProjectName();
  const environments = await promptForEnvironments();
  const domains = await promptForDomains(environments);
  const useTypeScript = await promptIfWantToUseTypeScript();
  const rootFolder = await promptForRootFolder(useTypeScript);
  const tsFolders = await promptForTypeScriptFolders(rootFolder, useTypeScript);
  return {
    project: {
      name: projectName,
      path: rootFolder,
      source: tsFolders === undefined ? undefined : tsFolders.sourceFolder,
      output: tsFolders === undefined ? undefined : tsFolders.outputFolder,
    },
    environments: ((): iEnvCollection => {
      const out: iEnvCollection = {};
      environments.forEach((env: string) => {
        out[env] = {
          name: env,
          defaultDomain: domains[`domain_${env}`],
        };
      });
      return out;
    })(),
    suites: {},
  };
}

function promptForDomains(
  environments: string[]
): Promise<prompts.Answers<string>> {
  const domainPrompts: prompts.PromptObject[] = [];
  environments.forEach((env: string) => {
    domainPrompts.push(promptUrl(`domain_${env}`, `Default Domain for ${env}`));
  });
  return prompts(domainPrompts);
}

async function promptIfWantToUseTypeScript(): Promise<boolean> {
  return (
    await prompts(
      promptToggle("useTypeScript", "Do you want Flagpole to use TypeScript?")
    )
  ).useTypeScript;
}

async function promptForRootFolder(useTypeScript: boolean): Promise<string> {
  return (
    await prompts(
      promptTextPath(
        "path",
        useTypeScript
          ? "What is the root subfolder you want to put your tests in? (tsconfig.json will go here)"
          : "What subfolder do you want to put your tests in?",
        "tests"
      )
    )
  ).path;
}

async function promptForProjectName(): Promise<string> {
  return (
    await prompts(
      promptTextName(
        "project",
        "What is the name of your project?",
        process.cwd().split(sep).pop()
      )
    )
  ).project;
}

async function promptForEnvironments(): Promise<string[]> {
  return (
    await prompts(
      promptMultiSelect(
        "env",
        "What environments do you want to support?",
        [
          { value: "dev", title: "dev" },
          { value: "stag", title: "stag" },
          { value: "prod", title: "prod" },
          { value: "preprod", title: "preprod" },
          { value: "qa", title: "qa" },
          { value: "local", title: "local" },
          { value: "alpha", title: "alpha" },
          { value: "beta", title: "beta" },
        ],
        1,
        8
      )
    )
  ).env;
}

async function promptForTypeScriptFolders(
  rootFolder: string,
  useTypeScript: boolean
): Promise<prompts.Answers<string> | undefined> {
  let tsFolders: undefined | prompts.Answers<string> = undefined;
  if (useTypeScript) {
    tsFolders = await prompts([
      {
        type: "text",
        name: "sourceFolder",
        message: `Source Folder ${rootFolder}/`,
        initial: `src`,
      },
      {
        type: "text",
        name: "outputFolder",
        message: `Output Folder ${rootFolder}/`,
        initial: `out`,
      },
    ]);
  }
  return tsFolders;
}
