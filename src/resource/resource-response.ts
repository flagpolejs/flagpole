import { ProtoResponse } from "../response";
import { ValuePromise } from "../value-promise";

export class ResourceResponse extends ProtoResponse {
  public find(): ValuePromise {
    throw new Error("Generic Response does not support find");
  }

  public async findAll(): Promise<any[]> {
    throw new Error("Generic Response does not support findAll");
  }
}
