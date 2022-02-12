import { SuiteStatusEvent } from "./enums";
import { Suite } from "../suite/suite";

export type SuiteStatusCallback = (
  suite: Suite,
  statusEvent: SuiteStatusEvent
) => any;

export type SuiteAsyncCallback = (suite: Suite) => Promise<void>;
export type SuiteSyncCallback = (suite: Suite) => void;
export type SuiteCallback = SuiteAsyncCallback | SuiteSyncCallback;
export type SuiteCallbackAndMessage = {
  message: string;
  callback: SuiteCallback;
};
