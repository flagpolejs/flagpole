export type CompareCallback = (a: any, b: any) => number;

export type JsFunction = string | (() => any);

export type ClassConstructor<T> = {
  new (...args: any[]): T;
};

export type OptionalXY = { x?: number; y?: number };

export interface iCallbackAndMessage {
  message: string;
  callback: Function;
}

export type KeyValue = {
  [key: string]: any;
};
