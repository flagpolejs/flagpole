import { iConsoleLine, LineType } from "./iconsole-log";

export interface iAssertionResult {
  className: string;
  toConsole(): iConsoleLine[];
  type: LineType;
  message: string;
  passed: boolean;
  failed: boolean;
  isOptional: boolean;
  timestamp: Date;
  toConsole(): iConsoleLine[];
  toJson(): any;
  toCsv(): string;
  toPsv(): string;
  toTsv(): string;
  toHtml(): string;
}
