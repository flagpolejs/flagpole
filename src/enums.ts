export enum ScenarioDisposition {
  pending = "pending",
  excuting = "executing",
  completed = "completed",
  skipped = "skipped",
  cancelled = "cancelled",
  aborted = "aborted",
}

export enum ScenarioStatusEvent {
  beforeExecute = "beforeExecute",
  executionStart = "executionStart",
  executionSkipped = "executionSkipped",
  executionCancelled = "executionCancelled",
  executionAborted = "executionAborted",
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
  | "extjs"
  | "xml"
  | "rss"
  | "atom";

export enum LineType {
  resultPass = "resultPass",
  resultFailure = "resultFailure",
  resultFailureDetails = "resultFailureDetails",
  resultFailureSource = "resultFailureSource",
  resultOptionalFailure = "resultOptionalFailure",
  comment = "comment",
  detail = "detail",
  h1 = "h1",
  h2 = "h2",
  h3 = "h3",
  decoration = "decoration",
  debugInfo = "debugInfo",
  summaryData = "summaryData",
}
