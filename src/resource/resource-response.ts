import { Value } from "../value";
import { ProtoResponse } from "../response";
import { ValuePromise } from "../value-promise";

export class ResourceResponse extends ProtoResponse {
  public find(): ValuePromise<any, Value<any>> {
    throw new Error("Generic Response does not support find");
  }

  public async findAll(): Promise<Value<any>[]> {
    throw new Error("Generic Response does not support findAll");
  }
}
