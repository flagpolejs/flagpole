import { HttpRequest, ProtoResponse } from "..";
import { AssertionContext } from "../assertion/assertion-context";

export type NextCallback = <
  RequestType extends HttpRequest,
  ResponseType extends ProtoResponse
>(
  context: AssertionContext<RequestType, ResponseType>,
  ...args: any[]
) => Promise<any> | void;
