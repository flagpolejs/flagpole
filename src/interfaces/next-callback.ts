import { AssertionContext } from "../assertion/assertion-context";

export interface NextCallback {
  (context: AssertionContext, ...args: any[]): Promise<any> | void;
}
