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
