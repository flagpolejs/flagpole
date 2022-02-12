import { ImageResponse } from "./image-response";
import { Scenario } from "../scenario";
import { ImageAdapter } from "./image-adapter";

export class ImageScenario extends Scenario<ImageResponse> {
  public readonly adapter = new ImageAdapter();
  public readonly response = new ImageResponse(this);
  public readonly typeName = "Image";
}
