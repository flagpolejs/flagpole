import { ImageResponse } from "./image-response";
import { ProtoScenario } from "../scenario";
import { ImageAdapter } from "./image-adapter";

export class ImageScenario extends ProtoScenario<ImageResponse> {
  public readonly adapter = new ImageAdapter();
  public readonly response = new ImageResponse(this);
  public readonly typeName = "Image";
}
