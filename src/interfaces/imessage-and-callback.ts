import { iNextCallback } from "./iassertioncontext";
import { iScenario } from "./iscenario";

export interface iMessageAndCallback {
  isSubScenario: boolean;
  message: string;
  callback: iNextCallback;
  scenario?: iScenario;
}
