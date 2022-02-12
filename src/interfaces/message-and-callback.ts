import { iScenario } from "./iscenario";
import { NextCallback } from "./next-callback";

export interface MessageAndCallback {
  isSubScenario: boolean;
  message: string;
  callback: NextCallback;
  scenario?: iScenario;
}
