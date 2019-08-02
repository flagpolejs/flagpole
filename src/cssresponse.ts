import { iResponse, GenericResponse, NormalizedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";

const css = require('css');

export class CssResponse extends GenericResponse implements iResponse {

    protected css: any;

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        this.status().between(200, 299);
        //this.headers('Content-Type').similarTo('text/css');
        this.css = css.parse(this.getBody(), { silent: true });
        this.validate();
    }

    public get typeName(): string {
        return 'Stylesheet';
    }

    public select(path: string): Node {
        return new Node(this, path, null);
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        throw new Error('Evaluate does not support stylesheets.');
    }

    public async asyncSelect(path: string): Promise<any | null> {
        throw new Error('CSS Response does not yet support select');
    }

    public async asyncSelectAll(path: string): Promise<any[]> {
        throw new Error('CSS Response does not yet support selectAll');
    }

    public getType(): ResponseType {
        return ResponseType.stylesheet;
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
