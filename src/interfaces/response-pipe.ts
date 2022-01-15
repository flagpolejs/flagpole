import { iHttpResponse } from "./http";

export type ResponseSyncPipe = (resp: iHttpResponse) => void | iHttpResponse;
export type ResponseAsyncPipe = (
  resp: iHttpResponse
) => Promise<void | iHttpResponse>;
export type ResponsePipe = ResponseSyncPipe | ResponseAsyncPipe;
export type ResponsePipeCallbackAndMessage = {
  message: string;
  callback: ResponsePipe;
};
