import { ProtoResponse } from "../response";
import { HttpResponse } from "../http/http-response";
import { ValuePromise } from "../value-promise";

export abstract class MediaResponse extends ProtoResponse {
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

  public find(path: string): ValuePromise {
    throw "This type of scenario does not suport find.";
  }

  public async findAll(path: string): Promise<any[]> {
    throw "This type of scenario does not suport findAll.";
  }

  protected _assertStatusCode() {
    this.context.assert("HTTP Status OK", this.statusCode).between(200, 299);
  }

  protected _assertMimeType() {
    this.context
      .assert(
        `MIME Type matches expected value for this type of scenario`,
        this.header("Content-Type")
      )
      .matches(this._mimePattern);
  }
}
