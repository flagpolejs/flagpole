import { Adapter } from "../adapter";
import { KeyValue } from "./generic-types";
import { ProtoResponse, Scenario, Suite } from "..";
import { ValueOptions } from "./value-options";

export interface ScenarioConstructor<
  ScenarioType extends Scenario,
  ScenarioOptions extends KeyValue = ScenarioType["opts"]
> {
  new (suite: Suite, title: string, opts: ScenarioOptions): ScenarioType;
}

export interface AdapterConstructor<AdapterType extends Adapter> {
  new (): AdapterType;
}

export interface WrapperConstructor<T> {
  new (input: any, context: any, opts: ValueOptions | string): T;
}

export interface ResponseConstructor<ResponseType extends ProtoResponse> {
  new (scenario: Scenario): ResponseType;
}
