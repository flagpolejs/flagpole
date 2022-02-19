import { Adapter } from "../adapter";
import { ClassConstructor, KeyValue } from "./generic-types";
import { Value } from "../value";
import { AssertionContext, ProtoResponse, Scenario, Suite } from "..";
import { ValueOptions } from "./value-options";

export interface ScenarioConstructor<ScenarioType extends Scenario> {
  new (
    suite: Suite,
    title: string,
    opts: KeyValue,
    ownType: ClassConstructor<Scenario>
  ): ScenarioType;
}

export interface AdapterConstructor<AdapterType extends Adapter> {
  new (): AdapterType;
}

export interface WrapperConstructor<WrapperType extends Value> {
  new (input: any, context: AssertionContext, opts: ValueOptions): WrapperType;
}

export interface ResponseConstructor<ResponseType extends ProtoResponse> {
  new (scenario: Scenario): ResponseType;
}
