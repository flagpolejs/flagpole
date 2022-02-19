import { ImageResponse } from "./image-response";
import { Scenario } from "../scenario";
import { ImageAdapter } from "./image-adapter";
import { AssertionContext, Value } from "..";

export class ImageScenario extends Scenario {
  public readonly typeName = "Image";
  public readonly context = new AssertionContext(
    this,
    ImageAdapter,
    ImageResponse,
    Value
  );
}
