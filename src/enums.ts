export enum ScenarioStatusEvent {
  beforeExecute,
  executionProgress,
  afterExecute,
  finished,
}

export enum SuiteStatusEvent {
  beforeAllExecute,
  beforeEachExecute,
  afterEachExecute,
  afterAllExecute,
  finished,
}

export type ResponseType =
  | "html"
  | "json"
  | "image"
  | "stylesheet"
  | "script"
  | "video"
  | "audio"
  | "resource"
  | "browser"
  | "extjs";

export enum LogItemType {
  Result,
  Comment,
  Heading,
  SummaryData,
}

export enum ConsoleLineType {
  Pass,
  Fail,
  Comment,
  Detail,
  Heading,
  Subheading,
  Decoration,
}

export enum ConsoleColor {
  Reset = "\x1b[0m",

  Highlight = "\x1b[7m",
  Unhighlight = "\x1b[27m",

  FgBlack = "\x1b[30m",
  FgRed = "\x1b[31m",
  FgGreen = "\x1b[32m",
  FgYellow = "\x1b[33m",
  FgBlue = "\x1b[34m",
  FgMagenta = "\x1b[35m",
  FgCyan = "\x1b[36m",
  FgWhite = "\x1b[37m",
  FgGray = "\x1b[90m",

  FgBrightBlack = "\x1b[30;1m",
  FgBrightRed = "\x1b[31;1m",
  FgBrightGreen = "\x1b[32;1m",
  FgBrightYellow = "\x1b[33;1m",
  FgBrightBlue = "\x1b[34;1m",
  FgBrightMagenta = "\x1b[35;1m",
  FgBrightCyan = "\x1b[36;1m",
  FgBrightWhite = "\x1b[37;1m",

  BgBlack = "\x1b[40m",
  BgRed = "\x1b[41m",
  BgGreen = "\x1b[42m",
  BgYellow = "\x1b[43m",
  BgBlue = "\x1b[44m",
  BgMagenta = "\x1b[45m",
  BgCyan = "\x1b[46m",
  BgWhite = "\x1b[47m",

  BgBrightBlack = "\x1b[40;1m",
  BgBrightRed = "\x1b[41;1m",
  BgBrightGreen = "\x1b[42;1m",
  BgBrightYellow = "\x1b[43;1m",
  BgBrightBlue = "\x1b[44;1m",
  BgBrightMagenta = "\x1b[45;1m",
  BgBrightCyan = "\x1b[46;1m",
  BgBrightWhite = "\x1b[47;1m",
}
