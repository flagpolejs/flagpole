import { iMessageAndCallback } from "../interfaces/imessage-and-callback";
import { iNextCallback } from "../interfaces/iassertioncontext";
import { iScenario } from "..";
import { toType } from "./to-type";

export function getMessageAndCallbackFromOverloading(
  a: any,
  b: any,
  defaultMessage: string = "Untitled"
): iMessageAndCallback {
  const message: string = typeof a == "string" ? a : defaultMessage;
  const callback: iNextCallback = (() => {
    // Handle overloading
    if (typeof b == "function") {
      return b;
    } else if (typeof a == "function") {
      return a;
    }
    // No callback was set, so just create a blank one
    else {
      return () => {};
    }
  })();
  const scenario: iScenario = (() => {
    if (toType(a) == "scenario") {
      return a;
    } else if (toType(b) == "scenario") {
      return b;
    }
    return undefined;
  })();
  return {
    isSubScenario: !!(a || b),
    message: message,
    callback: callback,
    scenario: scenario,
  };
}
