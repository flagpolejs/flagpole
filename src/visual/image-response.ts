import { ProtoResponse } from "../proto-response";
import { URL } from "url";
import { HttpResponse } from "../http/http-response";
import { ValuePromise } from "../value-promise";
import { JsonData } from "../json/jpath";
import { Value } from "../value";
import { NumericValue } from "../values/numeric-value";
import { JsonValue } from "../values/json-value";
import { StringValue } from "../values/string-value";

export interface ImageProperties {
  width: number;
  height: number;
  type: string;
  mime: string;
  length: number;
  url: string;
}

export class ImageResponse extends ProtoResponse {
  protected imageProperties: ImageProperties = {
    width: 0,
    height: 0,
    type: "",
    mime: "",
    length: 0,
    url: "",
  };

  public get length() {
    return new NumericValue(
      this.imageProperties.length,
      this.context,
      "Image Size"
    );
  }

  public get url() {
    return new StringValue(
      this.imageProperties.url,
      this.context,
      "URL of Image"
    );
  }

  public get path() {
    return new StringValue(
      new URL(this.imageProperties.url).pathname,
      this.context,
      "URL Path of Image"
    );
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.imageProperties = httpResponse.jsonBody as unknown as ImageProperties;
    this.context
      .assert(
        "MIME Type matches expected value for an image",
        this.imageProperties.mime
      )
      .startsWith("image/");
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public find(propertyName: string) {
    const input =
      typeof this.imageProperties[propertyName] !== "undefined"
        ? this.imageProperties[propertyName]
        : null;
    return ValuePromise.wrap(
      new JsonValue(input, this.context, `${propertyName} of Image`)
    );
  }

  public async findAll(propertyName: string): Promise<Value<JsonData>[]> {
    const value = await this.find(propertyName);
    return value.isNull() ? [] : [value];
  }
}
