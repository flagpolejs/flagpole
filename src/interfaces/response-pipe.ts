import { HttpResponse } from "../http/http-response";

export type ResponseSyncPipe = (resp: HttpResponse) => void | HttpResponse;
export type ResponseAsyncPipe = (
  resp: HttpResponse
) => Promise<void | HttpResponse>;
export type ResponsePipe = ResponseSyncPipe | ResponseAsyncPipe;
export type ResponsePipeCallbackAndMessage = {
  message: string;
  callback: ResponsePipe;
};
