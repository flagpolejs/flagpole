import { Command } from "../command";
import { Cli } from "../cli";
import { FlagpoleExecution } from "../../flagpoleexecution";
import { execSync } from "child_process";
import prompts = require("prompts");
import { promptTextPath, printSubheader, printLine } from "../cli-helper";

export default class Build extends Command {
  public commandString = "build";
  public description = "transpile tests from TypeScript to JavaScript";
  public async action() {
    await tsc(true);
  }
}

export async function tsc(exitOnSuccess: boolean = true) {
  if (!FlagpoleExecution.global.config) {
    throw "Flagpole config not found";
  }
  printSubheader("Build TypeScript Tests");
  // Is TSC installed?
  if (!(await isTscInstalled(3, 7, 0))) {
    return Cli.log(
      `Must have TypeScript installed globally, with at least version 3.7.0`,
      "",
      "Use this command:",
      "npm i -g typescript",
      ""
    ).exit(1);
  }
  // Project is configured to use TypeScript
  if (FlagpoleExecution.global.config.project.isTypeScript) {
    printLine("Transpiling TypeScript to JavaScript...");
    try {
      await FlagpoleExecution.global.config.tsc();
      printLine("Done!");
      if (exitOnSuccess) {
        Cli.exit(0);
      }
    } catch (err) {
      Cli.log(String(err)).exit(1);
    }
    return;
  }
  // No TypeScript in this project
  Cli.log(
    "This project is not currently configured to use TypeScript with Flagpole.",
    ""
  );
  // Do we want to configure TypeScript?
  const useTypeScript = await doYouWantToConfigureTypeScript();
  if (!useTypeScript) {
    Cli.exit(1);
    return;
  }
  const rootFolder = await setRootFolder();
  const sourceFolder = await setSourceFolder(rootFolder);
  const outputFolder = await setOutputFolder(rootFolder);
  FlagpoleExecution.global.config.project.setTypeScriptFolders(
    rootFolder,
    sourceFolder,
    outputFolder
  );
  await FlagpoleExecution.global.config.save();
  await FlagpoleExecution.global.config.writeTsConfig();
  Cli.log("");
}

const isTscInstalled = async (
  major: number,
  minor: number,
  build: number
): Promise<boolean> => {
  const result = execSync("tsc -v");
  const match = result.toString().match(/ ([1-9]+\.[0-9]+\.[0-9]+)/);
  if (match === null) {
    return false;
  }
  const version = match[1].split(".").map((n) => parseInt(n));
  return (
    version[0] > major ||
    (version[0] == major && version[1] > minor) ||
    (version[0] == major && version[1] == minor && version[2] >= build)
  );
};

const doYouWantToConfigureTypeScript = (): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const response = await prompts({
      type: "toggle",
      name: "useTypeScript",
      message: "Configure this project to use TypeScript?",
      initial: true,
      active: "Yes",
      inactive: "No",
    });
    resolve(response.useTypeScript);
  });
};

const setRootFolder = async (): Promise<string> => {
  const response = await prompts(
    promptTextPath(
      "rootFolder",
      "Flagpole Root Folder",
      `${FlagpoleExecution.global.config?.project.path}`
    )
  );
  return response.rootFolder;
};

const setSourceFolder = async (rootFolder: string): Promise<string> => {
  const response = await prompts(
    promptTextPath("sourceFolder", `Source Folder ${rootFolder}/`, `src`)
  );
  return response.sourceFolder;
};

const setOutputFolder = async (rootFolder: string): Promise<string> => {
  const response = await prompts(
    promptTextPath("outputFolder", `Output Folder ${rootFolder}/`, `out`)
  );
  return response.outputFolder;
};
