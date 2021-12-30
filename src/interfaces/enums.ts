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
