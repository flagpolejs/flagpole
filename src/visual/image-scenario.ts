import { ImageResponse } from "./image-response";
import { ProtoScenario } from "../scenario";
import { fetchImageWithNeedle } from "../adapters/image";

export class ImageScenario extends ProtoScenario {
  protected createResponse() {
    return new ImageResponse(this);
  }

  protected getRequestAdapter() {
    return fetchImageWithNeedle;
  }
}
