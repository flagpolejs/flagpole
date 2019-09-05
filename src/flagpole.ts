import { Suite } from './suite';

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
    static Suite(title: string): Suite {
        let suite: Suite = new Suite(title);
        Flagpole.suites.push(suite);
        return suite;
    }

}
