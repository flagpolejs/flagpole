import { HttpRequest } from "./http/http-request";
import { HttpResponse } from "./http/http-response";
import { KeyValue } from "./interfaces/generic-types";

export interface Adapter {
  fetch(req: HttpRequest, opts?: KeyValue): Promise<HttpResponse>;
}
