import { iConsoleLine, LineType } from "./iconsole-log";

export interface iLogItem {
  type: LineType;
  className: string;
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
