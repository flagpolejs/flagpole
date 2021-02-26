import { iResponse, iValue } from "../interfaces";
import { HttpResponse } from "../httpresponse";
import { JPathProvider, jpathFind, jpathFindAll, JsonDoc } from "../json/jpath";
import { wrapAsValue } from "../helpers";
import { ValuePromise } from "../value-promise";
import { JsonResponse } from "../json/jsonresponse";
import { ScenarioType } from "../scenario-types";

export class MediaStreamValidatorResponse
  extends JsonResponse
  implements iResponse, JPathProvider {
  public jsonDoc: JsonDoc | undefined;

  public get responseTypeName(): string {
    return "MediaStreamValidator Data";
  }

  public get responseType(): ScenarioType {
    return "mediastreamvalidator";
  }

  public get jsonBody(): iValue {
    return wrapAsValue(
      this.context,
      this.jsonDoc?.root,
      "MediaStreamValidator Data"
    );
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    try {
      this.jsonDoc = new JsonDoc(httpResponse.json);
    } catch (ex) {
      this.context.logFailure("Error parsing mediastreamvalidator output.", ex);
    }
  }

  public find = (path: string): ValuePromise => jpathFind(this, path);
  public findAll = (path: string): Promise<iValue[]> =>
    jpathFindAll(this, path);
}
