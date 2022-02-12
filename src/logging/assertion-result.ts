import {
  PassLine,
  OptionalFailLine,
  FailLine,
  SourceCodeBlock,
  WarningLine,
  ActionCompletedLine,
  ActionFailedLine,
  ErrorActualValueLine,
  ConsoleLine,
} from "./console-line";
import { LogItem } from "./log-item";
import { isNullOrUndefined, toType } from "../util";
import { LineType } from "../interfaces/line-type";

export abstract class AssertionResult extends LogItem {
  public abstract readonly type: LineType;
  public abstract className: string;

  public abstract toConsole(): ConsoleLine[];

  protected _rawDetails: any;
  protected _sourceCode: any = null;
  protected _highlight: string = "";
}

export class AssertionPass extends AssertionResult {
  public readonly type: LineType = LineType.resultPass;
  public readonly className: string = "pass";

  public get passed(): boolean {
    return true;
  }

  constructor(message: string) {
    super(message);
  }

  public toConsole(): ConsoleLine[] {
    return [new PassLine(this.message)];
  }
}

export class AssertionActionCompleted extends AssertionPass {
  public readonly type: LineType = LineType.detail;
  protected _verb: string;
  protected _noun: string;

  constructor(verb: string, noun: string) {
    super(`${verb} ${noun}`);
    this._verb = verb;
    this._noun = noun;
  }

  public toConsole(): ConsoleLine[] {
    return [new ActionCompletedLine(this._verb, this._noun)];
  }
}

export class AssertionFail extends AssertionResult {
  public readonly type: LineType = LineType.resultFailure;
  public readonly className: string = "fail";

  public get failed(): boolean {
    return true;
  }

  constructor(
    message: string,
    errorDetails: any,
    sourceCode: any = null,
    highlight: string = ""
  ) {
    super(message);
    this._rawDetails = errorDetails;
    this._sourceCode = sourceCode;
    this._highlight = highlight;
  }

  public get isDetails(): boolean {
    return !!this._rawDetails;
  }

  public get sourceCode(): string {
    return String(this._sourceCode);
  }

  public get detailsMessage(): string[] {
    // Get rid of blanks
    if (isNullOrUndefined(this._rawDetails)) {
      return [""];
    }
    // Okay give me something
    const type: string = toType(this._rawDetails);
    const details = this._rawDetails;
    if (type == "array") {
      const arr = details as Array<any>;
      if (
        arr.every((item) => {
          return typeof item == "string";
        })
      ) {
        return this._rawDetails;
      }
    } else if (details && details.message) {
      return [details.message];
    }
    return [String(details)];
  }

  public toConsole(): ConsoleLine[] {
    const lines: ConsoleLine[] = [new FailLine(this.message)];
    this.detailsMessage
      .filter((str) => str.length > 0)
      .forEach((details) => {
        lines.push(new ErrorActualValueLine(details));
      });
    if (this.sourceCode && this.sourceCode != "null") {
      lines.push(new SourceCodeBlock(this.sourceCode, this._highlight));
    }
    return lines;
  }

  public toHtml(): string {
    return `
        <li class="${this.className}">
          <span class="message">${this.message}</span>
          <ul><li>${this.detailsMessage}</li></ul>
        </li>
      `;
  }
}

export class AssertionFailOptional extends AssertionFail {
  public readonly type: LineType = LineType.resultOptionalFailure;
  public readonly className: string = "failOptional";

  public get isOptional(): boolean {
    return true;
  }

  public toConsole(): ConsoleLine[] {
    return [new OptionalFailLine(this.message)];
  }
}

export class AssertionFailWarning extends AssertionFail {
  public readonly type: LineType = LineType.comment;
  public readonly className: string = "failWarning";

  public get isOptional(): boolean {
    return true;
  }

  public toConsole(): ConsoleLine[] {
    return [new WarningLine(this.message)];
  }
}

export class AssertionActionFailed extends AssertionPass {
  public readonly type: LineType = LineType.resultFailure;
  protected _verb: string;
  protected _noun: string;

  constructor(verb: string, noun: string) {
    super(`${verb} ${noun}`);
    this._verb = verb;
    this._noun = noun;
  }

  public toConsole(): ConsoleLine[] {
    return [new ActionFailedLine(this._verb, this._noun)];
  }
}
