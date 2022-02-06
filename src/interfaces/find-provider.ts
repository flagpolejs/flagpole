import { iValue, ValuePromise } from "..";
import { FindAllOptions, FindOptions } from "./find-options";

export interface FindProvider {
  // ONE
  find<Wrapper extends iValue, InnerValue = any>(
    path: string,
    opts?: FindOptions
  ): ValuePromise<Wrapper>;
  find<Wrapper extends iValue>(
    path: string,
    contains: string,
    opts?: FindOptions
  ): ValuePromise<Wrapper>;
  find<Wrapper extends iValue>(
    path: string,
    mathces: RegExp,
    opts?: FindOptions
  ): ValuePromise<Wrapper>;
  // ALL
  findAll(path: string, opts?: FindAllOptions): Promise<iValue[]>;
  findAll(
    path: string,
    contains: string,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
  findAll(
    path: string,
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
}
