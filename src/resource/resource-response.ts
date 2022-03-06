import { ProtoResponse } from "../proto-response";
import { ValuePromise } from "../value-promise";
import { UnknownValue } from "../values/unknown-value";

export class ResourceResponse extends ProtoResponse {
  public find(): ValuePromise<UnknownValue> {
    throw new Error("Generic Response does not support find");
  }

  public async findAll(): Promise<UnknownValue[]> {
    throw new Error("Generic Response does not support findAll");
  }
}
