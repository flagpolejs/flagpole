import { iResponse } from "../interfaces/iresponse";
import { HttpResponse } from "../http-response";
import { JPathProvider, jpathFind, jpathFindAll, JsonDoc } from "../json/jpath";
import { wrapAsValue } from "../helpers";
import { ValuePromise } from "../value-promise";
import { JsonResponse } from "../json/json-response";
import { iValue } from "..";

export class MediaStreamValidatorResponse
  extends JsonResponse
  implements iResponse, JPathProvider
{
  public jsonDoc: JsonDoc | undefined;
  public readonly responseTypeName = "MediaStreamValidator Data";

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
