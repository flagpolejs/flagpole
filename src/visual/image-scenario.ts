import { ImageResponse } from "./image-response";
import { ProtoScenario } from "../scenario";
import { fetchImageWithNeedle } from "./image";

export class ImageScenario extends ProtoScenario {
  public readonly adapter = fetchImageWithNeedle;
  public readonly response = new ImageResponse(this);
}
