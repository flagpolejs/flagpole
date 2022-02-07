import { ImageResponse } from "./image-response";
import { ProtoScenario } from "../scenario";
import { fetchImageWithNeedle } from "./image-adapter";

export class ImageScenario extends ProtoScenario<ImageResponse> {
  public readonly adapter = fetchImageWithNeedle;
  public readonly typeName = "Image";
  protected readonly response = new ImageResponse(this);
}
