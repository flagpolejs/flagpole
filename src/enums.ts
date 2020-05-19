export type ScenarioDisposition =
  | "pending"
  | "executing"
  | "completed"
  | "skipped"
  | "cancelled"
  | "aborted";

export enum ScenarioStatusEvent {
  beforeExecute = "beforeExecute",
  executionStart = "executionStart",
  executionSkipped = "executionSkipped",
  executionCancelled = "executionCancelled",
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

export type LineType =
  | "resultPass"
  | "resultFailure"
  | "resultOptionalFailure"
  | "comment"
  | "detail"
  | "h1"
  | "h2"
  | "h3"
  | "decoration"
  | "debugInfo"
  | "summaryData";
