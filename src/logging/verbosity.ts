import { LineType } from "../interfaces/iconsole-log";

export const lineToVerbosity: { [key in LineType]: number } = {
  resultFailure: 10,
  resultFailureDetails: 15,
  resultFailureSource: 20,
  h1: 25,
  resultOptionalFailure: 30,
  h2: 30,
  h3: 40,
  summaryData: 45,
  resultPass: 45,
  comment: 49,
  detail: 47,
  decoration: 50,
  debugInfo: 90,
};
