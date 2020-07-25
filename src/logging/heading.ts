import { LogItem } from "./logitem";
import { SubheadingLine, SectionHeadingLine } from "./consoleline";
import { LineType } from "../enums";
import { iConsoleLine } from "../interfaces";

export class LogSuiteHeading extends LogItem {
  public readonly type: LineType = LineType.h1;
  public readonly className = "heading";

  public toHtml(): string {
    return `
            <h1>${this.message}</h1>
        `;
  }
}

export class LogScenarioHeading extends LogSuiteHeading {
  public readonly type = LineType.h2;
  public toHtml(): string {
    return `
            <h2>${this.message}</h2>
        `;
  }

  public toConsole(): iConsoleLine[] {
    return [new SubheadingLine(this.message)];
  }
}

export class LogScenarioSubHeading extends LogSuiteHeading {
  public readonly type = LineType.h3;
  public toHtml(): string {
    return `
            <li>
                <strong>${this.message}</strong>
            </li>
        `;
  }

  public toConsole(): iConsoleLine[] {
    return [new SectionHeadingLine(this.message)];
  }
}
