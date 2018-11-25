import { iResponse, GenericResponse, SimplifiedResponse } from "./response";
import { Scenario } from "./scenario";

const css = require('css');

export class CssResponse extends GenericResponse implements iResponse {

    protected css: any;

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.status().between(200, 299);
        this.headers('Content-Type').similarTo('text/css');
        this.css = css.parse(this.response.body, { silent: true });
        this.validate();
    }

    protected validate() {
        this.assert(
            (
                this.css.type == 'stylesheet' &&
                this.css.stylesheet &&
                this.css.stylesheet.parsingErrors &&
                this.css.stylesheet.parsingErrors.length === 0
            ),
            'CSS is valid',
            'CSS is not valid'
        );
    }

}
