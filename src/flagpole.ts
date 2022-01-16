import { Suite } from "./suite/suite";

export class Flagpole {
  public static suites: Suite[] = [];

  /**
   * Create a new suite
   *
   * @param {string} title
   * @returns {Suite}
   * @constructor
   */
  static suite = Flagpole.Suite;
  static Suite(title: string, callback?: (suite: Suite) => any): Suite {
    // Create suite
    const suite: Suite = new Suite(title);
    Flagpole.suites.push(suite);
    callback && callback(suite);
    return suite;
  }
}
