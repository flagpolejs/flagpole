import { ProtoResponse } from "../response";
import { URL } from "url";
import { HttpResponse } from "../http/http-response";
import { ValuePromise } from "../value-promise";
import { JsonData } from "../json/jpath";
import { Value } from "../value";

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

  public get length(): Value<number> {
    return this.valueFactory.create(this.imageProperties.length, "Image Size");
  }

  public get url(): Value<string> {
    return this.valueFactory.create(this.imageProperties.url, "URL of Image");
  }

  public get path(): Value<string> {
    return this.valueFactory.create(
      new URL(this.imageProperties.url).pathname,
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

  public find(propertyName: string): ValuePromise<JsonData, Value<JsonData>> {
    const input =
      typeof this.imageProperties[propertyName] !== "undefined"
        ? this.imageProperties[propertyName]
        : null;
    return this.valueFactory.createPromise(input, `${propertyName} of Image`);
  }

  public async findAll(propertyName: string): Promise<Value<JsonData>[]> {
    const value = await this.find(propertyName);
    return value.isNull() ? [] : [value];
  }
}
