import { HttpRequest } from "..";
import { AssertionResult } from "../logging/assertion-result";
import { ProtoResponse } from "../proto-response";
import { Suite } from "../suite/suite";

export interface iScenario {
  suite: Suite;
  currentUrl: string;
  comment(input: any): void;
  response: ProtoResponse;
  request: HttpRequest;
  set(aliasName: string, value: any): this;
  get<T>(aliasName: string): T;
  push(key: string, value: any): this;
  result(result: AssertionResult): this;
  abort(message?: string): Promise<this>;
}
