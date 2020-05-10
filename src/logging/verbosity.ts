import { LineType } from "../enums";

export const lineToVerbosity: { [key in LineType]: number } = {
  resultFailure: 10,
  resultOptionalFailure: 30,
  resultPass: 50,
  comment: 50,
  detail: 50,
  h1: 20,
  h2: 30,
  h3: 40,
  decoration: 50,
  debugInfo: 90,
  summaryData: 50,
};
