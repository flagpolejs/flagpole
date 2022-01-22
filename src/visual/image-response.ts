import { ProtoResponse } from "../response";
import { iResponse } from "../interfaces/iresponse";
import { URL } from "url";
import { HttpResponse } from "../http/http-response";
import { Value } from "../value";
import { ValuePromise } from "../value-promise";
import { iValue } from "../interfaces/ivalue";

export interface ImageProperties {
  width: number;
  height: number;
  type: string;
  mime: string;
  length: number;
  url: string;
}

export class ImageResponse extends ProtoResponse implements iResponse {
  protected imageProperties: ImageProperties = {
    width: 0,
    height: 0,
    type: "",
    mime: "",
    length: 0,
    url: "",
  };

  public get length(): iValue {
    return this.valueFactory.create(this.imageProperties.length, {
      name: "Image Size",
    });
  }

  public get url(): iValue {
    return this.valueFactory.create(this.imageProperties.url, {
      name: "URL of Image",
    });
  }

  public get path(): iValue {
    return this.valueFactory.create(
      new URL(this.imageProperties.url).pathname,
      {
        name: "URL Path of Image",
      }
    );
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.imageProperties = httpResponse.jsonBody as ImageProperties;
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

  public find(propertyName: string): ValuePromise {
    return this.valueFactory.createPromise(
      typeof this.imageProperties[propertyName] !== "undefined"
        ? this.imageProperties[propertyName]
        : null,
      { name: `${propertyName} of Image` }
    );
  }

  public async findAll(propertyName: string): Promise<iValue[]> {
    const value: iValue = await this.find(propertyName);
    return value.isNull() ? [] : [value];
  }
}
