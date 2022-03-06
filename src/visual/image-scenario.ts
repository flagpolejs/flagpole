import { ImageResponse } from "./image-response";
import { Scenario } from "../scenario";
import { ImageAdapter } from "./image-adapter";
import { HttpRequest } from "..";

export class ImageScenario extends Scenario {
  public readonly typeName = "Image";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter = new ImageAdapter();
  public readonly response: ImageResponse = new ImageResponse(this);
}
