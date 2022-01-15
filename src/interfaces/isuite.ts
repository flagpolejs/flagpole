import { SuiteStatusEvent } from "./enums";
import { FlagpoleExecution } from "../flagpole-execution";
import { ClassConstructor, KeyValue } from "./generic-types";
import {
  iScenario,
  ScenarioCallback,
  ScenarioInitOptions,
  ScenarioMapper,
} from "./iscenario";
import { ScenarioType } from "../scenario-types";

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
  scenarios: Array<iScenario>;
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
  subscribe(callback: SuiteStatusCallback): iSuite;
  verifyCert(verify: boolean): iSuite;
  verifySslCert(verify: boolean): iSuite;
  wait(bool?: boolean): iSuite;
  print(exitAfterPrint?: boolean): void;
  scenario<T extends iScenario>(
    title: string,
    type: ClassConstructor<T>,
    opts?: KeyValue
  ): T;
  scenario<T extends iScenario>(
    title: string,
    type: ScenarioType,
    opts?: KeyValue
  ): T;
  base(url: string | KeyValue): iSuite;
  execute(): iSuite;
  beforeAll(callback: SuiteCallback): iSuite;
  beforeEach(callback: ScenarioCallback): iSuite;
  afterEach(callback: ScenarioCallback): iSuite;
  afterAll(callback: SuiteCallback): iSuite;
  success(callback: SuiteCallback): iSuite;
  failure(callback: SuiteCallback): iSuite;
  finally(callback: SuiteCallback): iSuite;
  promise(): Promise<iSuite>;
  mapScenarios(key: string, mapper: ScenarioMapper): Promise<iScenario[]>;
  mapScenarios(arr: any[], mapper: ScenarioMapper): Promise<iScenario[]>;
  push(key: string, value: any): iSuite;
  set<T>(key: string, value: T): iSuite;
  get<T>(key: string): T;
  template<T extends iScenario>(
    templateOptions: ScenarioInitOptions<T>
  ): (title: string, scenarioOptions: ScenarioInitOptions<T>) => T;
}
