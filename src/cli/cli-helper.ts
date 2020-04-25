import { FlagpoleExecution } from "../flagpoleexecutionoptions";
import prompts = require("prompts");
import ansiAlign = require("ansi-align");
import { Cli } from "./cli";

export function printHeader() {
  if (FlagpoleExecution.opts.shouldPrintTextOutput) {
    console.log("\u001b[0m \u001b[37m^\u001b[0m ");
    console.log(
      "\u001b[0m \u001b[47m \u001b[0m \u001b[44m\u001b[37m ****** \u001b[41m                 \u001b[0m\u001b[37;1m\u001b[1m   F L A G P O L E   J S"
    );
    console.log(
      "\u001b[0m \u001b[47m \u001b[0m \u001b[44m\u001b[37m ****** \u001b[47m                 \u001b[0m"
    );
    console.log(
      "\u001b[0m \u001b[47m \u001b[0m \u001b[44m\u001b[37m ****** \u001b[41m                 \u001b[0m\u001b[238m   Version 2.2"
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
  if (FlagpoleExecution.opts.shouldPrintTextOutput) {
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

export function printConsoleLine(message: string) {
  if (FlagpoleExecution.opts.shouldPrintTextOutput) {
    Cli.log(message);
  }
}

export function printSubheader(heading: string) {
  if (FlagpoleExecution.opts.shouldPrintTextOutput) {
    console.log(
      ansiAlign.center(
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
  if (FlagpoleExecution.opts.shouldPrintTextOutput) {
    messages.forEach((message) => {
      console.log(message);
    });
  }
}

export function trimInput(input) {
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
