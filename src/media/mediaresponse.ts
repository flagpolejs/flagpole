import { iResponse, iValue } from "../interfaces";
import { ProtoResponse } from "../response";
import { HttpResponse } from "../httpresponse";
import { ValuePromise } from "../value-promise";

export abstract class MediaResponse extends ProtoResponse implements iResponse {
  protected abstract _mimePattern: RegExp;

  protected get extension(): string {
    return (
      this.finalUrl.toURL().pathname.split(".").pop() || ""
    ).toLowerCase();
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this._assertStatusCode();
    this._assertMimeType();
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public find(path: string): ValuePromise {
    throw "This type of scenario does not suport find.";
  }

  public async findAll(path: string): Promise<iValue[]> {
    throw "This type of scenario does not suport findAll.";
  }

  protected _assertStatusCode() {
    this.context.assert("HTTP Status OK", this.statusCode).between(200, 299);
  }

  protected _assertMimeType() {
    this.context
      .assert(
        `MIME Type matches expected value for ${this.responseType}`,
        this.header("Content-Type")
      )
      .matches(this._mimePattern);
  }
}
