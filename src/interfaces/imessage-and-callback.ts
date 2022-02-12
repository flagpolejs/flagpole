import { iScenario } from "./iscenario";
import { NextCallback } from "./next-callback";

export interface iMessageAndCallback {
  isSubScenario: boolean;
  message: string;
  callback: NextCallback;
  scenario?: iScenario;
}
