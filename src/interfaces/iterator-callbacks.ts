export type SyncMapperCallback = (
  value: any,
  index?: number,
  arr?: any[]
) => any;
export type SyncIteratorCallback = (
  value: any,
  index: number,
  arr: any[]
) => any;
export type SyncIteratorBoolCallback = (
  value: any,
  i?: number,
  arr?: any[]
) => boolean;
export type SyncReducerCallback = (
  prev: any,
  cur: any,
  i: number,
  arr: any[]
) => any;

export type AsyncMapperCallback = (
  value: any,
  index?: number,
  arr?: any[]
) => Promise<any>;
export type AsyncIteratorCallback = (
  value: any,
  index: number,
  arr: any[]
) => Promise<any>;
export type AsyncIteratorBoolCallback = (
  value: any,
  i?: number,
  arr?: any[]
) => Promise<boolean>;
export type AsyncReducerCallback = (
  prev: any,
  cur: any,
  i: number,
  arr: any[]
) => Promise<any>;

export type MapperCallback = SyncMapperCallback | AsyncMapperCallback;
export type IteratorCallback = SyncIteratorCallback | AsyncIteratorCallback;
export type IteratorBoolCallback =
  | SyncIteratorBoolCallback
  | AsyncIteratorBoolCallback;
export type ReducerCallback = SyncReducerCallback | AsyncReducerCallback;
