import prompts = require("prompts");
import { FlagpoleExecution } from "../flagpoleexecution";
import * as fs from "fs-extra";
import { sep } from "path";
import Ansi from "cli-ansi";

export function printHeader(alwaysPrint: boolean = false) {
  if (alwaysPrint || FlagpoleExecution.global.shouldOutputToConsole) {
    console.log("\u001b[0m \u001b[37m^\u001b[0m ");
    console.log(
      "\u001b[0m \u001b[47m \u001b[0m \u001b[44m\u001b[37m ****** \u001b[41m                 \u001b[0m\u001b[37;1m\u001b[1m   F L A G P O L E   J S"
    );
    console.log(
      "\u001b[0m \u001b[47m \u001b[0m \u001b[44m\u001b[37m ****** \u001b[47m                 \u001b[0m"
    );
    console.log(
      "\u001b[0m \u001b[47m \u001b[0m \u001b[44m\u001b[37m ****** \u001b[41m                 \u001b[0m\u001b[238m   Version 2.3"
    );
    console.log(
      "\u001b[0m \u001b[47m \u001b[0m \u001b[47m                         \u001b[0m"
    );
    console.log(
      "\u001b[0m \u001b[47m \u001b[0m \u001b[41m                         \u001b[0m"
    );
    console.log("\u001b[0m \u001b[47m \u001b[0m ");
  }
}

export function printOldHeader() {
  if (FlagpoleExecution.global.shouldOutputToConsole) {
    console.log(
      "\x1b[32m",
      `
        \x1b[31m $$$$$$$$\\ $$\\                                         $$\\           
        \x1b[31m $$  _____|$$ |                                        $$ |          
        \x1b[31m $$ |      $$ | $$$$$$\\   $$$$$$\\   $$$$$$\\   $$$$$$\\  $$ | $$$$$$\\  
        \x1b[31m $$$$$\\    $$ | \\____$$\\ $$  __$$\\ $$  __$$\\ $$  __$$\\ $$ |$$  __$$\\ 
        \x1b[37m $$  __|   $$ | $$$$$$$ |$$ /  $$ |$$ /  $$ |$$ /  $$ |$$ |$$$$$$$$ |
        \x1b[37m $$ |      $$ |$$  __$$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |$$   ____|
        \x1b[37m $$ |      $$ |\\$$$$$$$ |\\$$$$$$$ |$$$$$$$  |\\$$$$$$  |$$ |\\$$$$$$$\\ 
        \x1b[34m \\__|      \\__| \\_______| \\____$$ |$$  ____/  \\______/ \\__| \\_______|
        \x1b[34m                         $$\\   $$ |$$ |                              
        \x1b[34m                         \\$$$$$$  |$$ |                              
        \x1b[34m                          \\______/ \\__|`,
      "\x1b[0m",
      "\n"
    );
  }
}

export function printSubheader(heading: string) {
  if (FlagpoleExecution.global.shouldOutputToConsole) {
    console.log(
      Ansi.center(
        "\x1b[31m===========================================================================\x1b[0m\n" +
          "\x1b[0m" +
          heading +
          "\n" +
          "\x1b[31m===========================================================================\x1b[0m\n"
      )
    );
  }
}

export function printLine(...messages: string[]) {
  if (FlagpoleExecution.global.shouldOutputToConsole) {
    messages.forEach((message) => {
      console.log(message);
    });
  }
}

export function findDetachedSuites(): string[] {
  const suitesInFolder: string[] = findJsFilesInTestFolder();
  let suitesAvailableToImport: string[] = [];
  let suitesInConfig: string[] =
    FlagpoleExecution.global.config.getSuiteNames() || [];
  suitesInFolder.forEach(function (suiteName: string) {
    if (!suitesInConfig.includes(suiteName)) {
      suitesAvailableToImport.push(suiteName);
    }
  });
  return suitesAvailableToImport;
}

export function findJsFilesInTestFolder(): string[] {
  const startFolder: string = FlagpoleExecution.global.config.getTestsFolder();
  const suitesInFolder: string[] = [];

  function findSuites(dir: string, isSubFolder: boolean = false) {
    // Does this folder exist?
    if (fs.pathExistsSync(dir)) {
      // Read contents
      let files = fs.readdirSync(dir);
      files.forEach(function (file) {
        // Drill into sub-folders, but only once!
        if (!isSubFolder && fs.statSync(dir + file).isDirectory()) {
          findSuites(`${dir}${file}${sep}`, true);
        }
        // Push in any JS files
        else if (file.endsWith(".js")) {
          let name: string = (dir + file)
            .replace(startFolder, "")
            .replace(/\.js$/i, "");
          suitesInFolder.push(name);
        }
      });
    }
  }

  findSuites(startFolder);
  return suitesInFolder;
}

export function trimInput(input: string) {
  return input.trim();
}

export function stringArrayToPromptChoices(arr: string[]): prompts.Choice[] {
  const out: prompts.Choice[] = [];
  arr.forEach((item) => {
    out.push({ title: item, value: item });
  });
  return out;
}

export function promptTextName(
  name: string,
  message: string,
  initial?: string
): prompts.PromptObject<string> {
  return {
    type: "text",
    name: name,
    message: message,
    initial: initial || "",
    format: trimInput,
    validate: (input: string) => {
      return /^[a-z0-9][a-z0-9/\/_-]{1,62}[a-z0-9]$/i.test(input);
    },
  };
}

export function promptUrl(
  name: string,
  message: string,
  initial?: string
): prompts.PromptObject<string> {
  return {
    type: "text",
    name: name,
    message: message,
    initial: initial || "",
    format: trimInput,
    validate: (input: string) => {
      return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i.test(
        input
      );
    },
  };
}

export function promptTextPath(
  name: string,
  message: string,
  initial?: string
): prompts.PromptObject<string> {
  return {
    type: "text",
    name: name,
    message: message,
    initial: initial || "/",
    format: trimInput,
  };
}

export function promptTextDescription(
  name: string,
  message: string,
  initial?: string
): prompts.PromptObject<string> {
  return {
    type: "text",
    name: name,
    message: message,
    initial: initial || "",
    format: trimInput,
  };
}

export function promptMultiSelect(
  name: string,
  message: string,
  choices: prompts.Choice[],
  minSelections: number = 1,
  maxSeletions?: number
): prompts.PromptObject<string> {
  return {
    type: "multiselect",
    name: name,
    min: minSelections,
    max: maxSeletions,
    message: message,
    choices: choices,
  };
}

export function promptSelect(
  name: string,
  message: string,
  choices: prompts.Choice[],
  initial?: number
): prompts.PromptObject<string> {
  const obj: prompts.PromptObject<string> = {
    type: "select",
    name: name,
    message: message,
    choices: choices,
  };
  if (initial !== undefined) {
    obj.initial = initial || 0;
  }
  return obj;
}

export function promptConfirm(
  name: string,
  message: string,
  initial: boolean = false
): prompts.PromptObject<string> {
  return {
    type: "confirm",
    name: name,
    message: message,
    initial: initial,
  };
}

export function promptToggle(
  name: string,
  message: string,
  initial: boolean = false,
  yesText: string = "yes",
  noText: string = "no"
): prompts.PromptObject<string> {
  return {
    type: "toggle",
    name: name,
    message: message,
    initial: initial,
    active: yesText,
    inactive: noText,
  };
}

export function promptList(
  name: string,
  message: string
): prompts.PromptObject<string> {
  return {
    type: "list",
    name: name,
    message: message,
    separator: " ",
    initial: "",
    validate: function (input) {
      return /^[A-Z0-9 -_]*$/i.test(input);
    },
  };
}
