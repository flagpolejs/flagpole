import { ImageResponse } from "./image-response";
import { ProtoScenario } from "../scenario";
import { fetchImageWithNeedle } from "../adapters/image";

export class ImageScenario extends ProtoScenario {
  protected responseClass = ImageResponse;
  protected requestAdapter = fetchImageWithNeedle;
}
