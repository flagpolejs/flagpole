import { Cli } from "./cli";
import { execSync } from "child_process";
import * as prompts from "prompts";
import { printSubheader, printLine } from "./cli-helper";

export async function build(exitOnSuccess: boolean = true) {
  Cli.hideBanner = true;
  printSubheader("Build TypeScript Tests");
  // Is TSC installed?
  if (!(await isTscInstalled(3, 7, 0))) {
    printLine(
      `Must have TypeScript installed globally, with at least version 3.7.0`,
      "",
      "Use this command:",
      "npm i -g typescript",
      ""
    );
    Cli.exit(1);
    return;
  }
  // TypeScript is configured
  if (Cli.config.project.isSourceAndOutput) {
    printLine("Transpiling TypeScript to JavaScript...");
    try {
      await Cli.config.tsc();
      printLine("Done!");
      if (exitOnSuccess) {
        Cli.exit(0);
      }
    } catch (err) {
      Cli.log(String(err));
      Cli.exit(1);
    }
    return;
  }
  printLine(
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
  Cli.config.project.setTypeScriptFolders(
    rootFolder,
    sourceFolder,
    outputFolder
  );
  await Cli.config.save();
  const tsconfigPath = await Cli.config.writeTsConfig();
  printLine("");
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

const setRootFolder = (): Promise<string> => {
  return new Promise(async (resolve) => {
    const response = await prompts({
      type: "text",
      name: "rootFolder",
      message: "Flagpole Root Folder",
      initial: `${Cli.config.project.path}`,
    });
    resolve(response.rootFolder);
  });
};

const setSourceFolder = (rootFolder: string): Promise<string> => {
  return new Promise(async (resolve) => {
    const response = await prompts({
      type: "text",
      name: "sourceFolder",
      message: `Source Folder ${rootFolder}/`,
      initial: `src`,
    });
    resolve(response.sourceFolder);
  });
};

const setOutputFolder = (rootFolder: string): Promise<string> => {
  return new Promise(async (resolve) => {
    const response = await prompts({
      type: "text",
      name: "outputFolder",
      message: `Output Folder ${rootFolder}/`,
      initial: `out`,
    });
    resolve(response.outputFolder);
  });
};
