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

export interface iConsoleLine {
  timestamp: Date;
  fg: [number, number, number];
  message: string;
  type: LineType;
  toConsoleString(): string;
  toString(): string;
}
