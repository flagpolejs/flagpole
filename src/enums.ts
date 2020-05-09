export enum ScenarioStatusEvent {
  beforeExecute = "beforeExecute",
  executionStart = "executionStart",
  executionSkipped = "executionSkipped",
  executionProgress = "executionProgress",
  afterExecute = "afterExecute",
  finished = "finished",
}

export enum SuiteStatusEvent {
  beforeAllExecute = "beforeAllExecute",
  beforeEachExecute = "beforeEachExecute",
  afterEachExecute = "afterEachExecute",
  afterAllExecute = "afterAllExecute",
  finished = "finished",
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
