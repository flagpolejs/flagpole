import { HttpRequest } from "..";
import { Assertion } from "../assertion/assertion";
import { AssertionResult } from "../logging/assertion-result";
import { ProtoResponse } from "../proto-response";
import { Scenario } from "../scenario";

export interface iAssertionContext {
  request: HttpRequest;
  response: ProtoResponse;
  scenario: Scenario;
  comment(message: string): void;
  assert(a: any, b?: any): Assertion<any>;
  set(aliasName: string, value: any): this;
  get(aliasName: string): any;
  logPassing(message: string): AssertionResult;
  logOptionalFailure(message: string, errorDetails?: any): AssertionResult;
  logFailure(
    message: string,
    errorDetails?: any,
    sourceCode?: any,
    highlightText?: any
  ): AssertionResult;
  eval(callback: any, ...args: any[]): Promise<any>;
}
