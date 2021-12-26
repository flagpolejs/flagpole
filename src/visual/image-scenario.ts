import { ImageResponse } from "./image-response";
import { ProtoScenario } from "../scenario";
import { fetchImageWithNeedle } from "../adapters/image";

export class ImageScenario extends ProtoScenario {
  public readonly requestAdapter = fetchImageWithNeedle;
  public readonly response = new ImageResponse(this);
}
