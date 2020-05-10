import { iLogItem, iConsoleLine, iAssertionResult } from "../interfaces";
import { LineType } from "../enums";
import {
  PassLine,
  OptionalFailLine,
  FailLine,
  DetailLine,
  SourceCodeBlock,
  WarningLine,
  ActionCompletedLine,
  ActionFailedLine,
} from "./consoleline";
import { LogItem } from "./logitem";
import { isNullOrUndefined, toType } from "../util";

export abstract class AssertionResult extends LogItem
  implements iLogItem, iAssertionResult {
  public abstract readonly type: LineType;
  public abstract className: string;

  public abstract toConsole(): iConsoleLine[];

  protected _rawDetails: any;
  protected _sourceCode: any = null;
  protected _highlight: string = "";
}

export class AssertionPass extends AssertionResult implements iLogItem {
  public readonly type: LineType = "resultPass";
  public readonly className: string = "pass";

  public get passed(): boolean {
    return true;
  }

  constructor(message: string) {
    super(message);
  }

  public toConsole(): iConsoleLine[] {
    return [new PassLine(this.message)];
  }
}

export class AssertionActionCompleted extends AssertionPass {
  public readonly type: LineType = "detail";
  protected _verb: string;
  protected _noun: string;

  constructor(verb: string, noun: string) {
    super(`${verb} ${noun}`);
    this._verb = verb;
    this._noun = noun;
  }

  public toConsole(): iConsoleLine[] {
    return [new ActionCompletedLine(this._verb, this._noun)];
  }
}

export class AssertionFail extends AssertionResult implements iLogItem {
  public readonly type: LineType = "resultFailure";
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

  public get detailsMessage(): string {
    // Get rid of blanks
    if (isNullOrUndefined(this._rawDetails)) {
      return "";
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
      return details.message;
    }
    return String(details);
  }

  public toConsole(): iConsoleLine[] {
    const lines: iConsoleLine[] = [new FailLine(this.message)];
    const details: string = this.detailsMessage;
    if (details) {
      lines.push(new DetailLine(this.detailsMessage));
    }
    if (this.sourceCode && this.sourceCode != "null") {
      lines.push(new SourceCodeBlock(this.sourceCode, this._highlight));
    }
    return lines;
  }
}

export class AssertionFailOptional extends AssertionFail implements iLogItem {
  public readonly type: LineType = "resultOptionalFailure";
  public readonly className: string = "failOptional";

  public get isOptional(): boolean {
    return true;
  }

  public toConsole(): iConsoleLine[] {
    return [new OptionalFailLine(this.message)];
  }
}

export class AssertionFailWarning extends AssertionFail implements iLogItem {
  public readonly type: LineType = "comment";
  public readonly className: string = "failWarning";

  public get isOptional(): boolean {
    return true;
  }

  public toConsole(): iConsoleLine[] {
    return [new WarningLine(this.message)];
  }
}

export class AssertionActionFailed extends AssertionPass implements iLogItem {
  public readonly type: LineType = "resultFailure";
  protected _verb: string;
  protected _noun: string;

  constructor(verb: string, noun: string) {
    super(`${verb} ${noun}`);
    this._verb = verb;
    this._noun = noun;
  }

  public toConsole(): iConsoleLine[] {
    return [new ActionFailedLine(this._verb, this._noun)];
  }
}
