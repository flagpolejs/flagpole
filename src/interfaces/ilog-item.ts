import { ConsoleLine } from "../logging/console-line";
import { LineType } from "./line-type";

export interface iLogItem {
  type: LineType;
  className: string;
  message: string;
  passed: boolean;
  failed: boolean;
  isOptional: boolean;
  timestamp: Date;
  toConsole(): ConsoleLine[];
  toJson(): any;
  toCsv(): string;
  toPsv(): string;
  toTsv(): string;
  toHtml(): string;
}
