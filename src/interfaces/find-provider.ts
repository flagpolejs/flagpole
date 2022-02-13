import { iValue, ValuePromise } from "..";
import { FindAllOptions, FindOptions } from "./find-options";

export interface FindProvider {
  // ONE
  find<InputType, Wrapper extends iValue<InputType>>(
    path: string,
    opts?: FindOptions
  ): ValuePromise<InputType, Wrapper>;
  find<InputType, Wrapper extends iValue<InputType>>(
    path: string,
    contains: string,
    opts?: FindOptions
  ): ValuePromise<InputType, Wrapper>;
  find<InputType, Wrapper extends iValue<InputType>>(
    path: string,
    mathces: RegExp,
    opts?: FindOptions
  ): ValuePromise<InputType, Wrapper>;

  // ALL
  findAll<InputType, Wrapper extends iValue<InputType>>(
    path: string,
    opts?: FindAllOptions
  ): Promise<Wrapper[]>;
  findAll<InputType, Wrapper extends iValue<InputType>>(
    path: string,
    contains: string,
    opts?: FindAllOptions
  ): Promise<Wrapper[]>;
  findAll<InputType, Wrapper extends iValue<InputType>>(
    path: string,
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<Wrapper[]>;
}
