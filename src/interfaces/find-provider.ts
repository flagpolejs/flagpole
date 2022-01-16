import { FindAllOptions, FindOptions, iValue } from ".";
import { ValuePromise } from "../value-promise";

export interface FindProvider {
  exists(selector?: string): ValuePromise;
  find(selector: string, opts?: FindOptions): ValuePromise;
  find(selector: string, contains: string, opts?: FindOptions): ValuePromise;
  find(selector: string, mathces: RegExp, opts?: FindOptions): ValuePromise;
  findAll(selector: string, opts?: FindAllOptions): Promise<iValue[]>;
  findAll(
    selector: string,
    contains: string,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
  findAll(
    selector: string,
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
}
