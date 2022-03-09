import { Scenario } from "../scenario";
import { NextCallback } from "./next-callback";

export interface MessageAndCallback {
  isSubScenario: boolean;
  message: string;
  callback: NextCallback<any>;
  scenario?: Scenario;
}
