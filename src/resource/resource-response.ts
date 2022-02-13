import { iValue } from "..";
import { ProtoResponse } from "../response";
import { ValuePromise } from "../value-promise";

export class ResourceResponse extends ProtoResponse {
  public find(): ValuePromise<any, iValue> {
    throw new Error("Generic Response does not support find");
  }

  public async findAll(): Promise<iValue<any>[]> {
    throw new Error("Generic Response does not support findAll");
  }
}
