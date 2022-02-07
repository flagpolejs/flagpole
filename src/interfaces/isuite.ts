import { SuiteStatusEvent } from "./enums";
import { FlagpoleExecution } from "../flagpole-execution";
import { ClassConstructor, KeyValue } from "./generic-types";
import {
  iScenario,
  ScenarioCallback,
  ScenarioInitOptions,
  ScenarioMapper,
} from "./iscenario";

export type SuiteStatusCallback = (
  suite: iSuite,
  statusEvent: SuiteStatusEvent
) => any;

export type SuiteAsyncCallback = (suite: iSuite) => Promise<void>;
export type SuiteSyncCallback = (suite: iSuite) => void;
export type SuiteCallback = SuiteAsyncCallback | SuiteSyncCallback;
export type SuiteCallbackAndMessage = {
  message: string;
  callback: SuiteCallback;
};

export interface iSuite {
  scenarios: iScenario[];
  baseUrl: URL | null;
  failCount: number;
  hasPassed: boolean;
  hasFailed: boolean;
  hasExecuted: boolean;
  hasFinished: boolean;
  totalDuration: number | null;
  executionDuration: number | null;
  maxScenarioDuration: number;
  maxSuiteDuration: number;
  concurrencyLimit: number;
  title: string;
  finished: Promise<void>;
  executionOptions: FlagpoleExecution;
  import(scenario: iScenario): iScenario;
  subscribe(callback: SuiteStatusCallback): this;
  verifyCert(verify: boolean): this;
  verifySslCert(verify: boolean): this;
  wait(bool?: boolean): this;
  print(exitAfterPrint?: boolean): void;
  scenario<T extends iScenario>(
    title: string,
    type: ClassConstructor<T>,
    opts?: KeyValue
  ): T;
  base(url: string | KeyValue): this;
  execute(): this;
  beforeAll(callback: SuiteCallback): this;
  beforeEach(callback: ScenarioCallback): this;
  afterEach(callback: ScenarioCallback): this;
  afterAll(callback: SuiteCallback): this;
  success(callback: SuiteCallback): this;
  failure(callback: SuiteCallback): this;
  finally(callback: SuiteCallback): this;
  promise(): Promise<iSuite>;
  mapScenarios(key: string, mapper: ScenarioMapper): Promise<iScenario[]>;
  mapScenarios(arr: any[], mapper: ScenarioMapper): Promise<iScenario[]>;
  push(key: string, value: any): this;
  set<T>(key: string, value: T): this;
  get<T>(key: string): T;
  template<T extends iScenario>(
    templateOptions: ScenarioInitOptions<T>
  ): (title: string, scenarioOptions: ScenarioInitOptions<T>) => T;
}
