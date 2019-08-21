import { iResponse, ResponseType } from "./response";
import { PuppeteerResponse } from './puppeteerresponse';
import { ExtJsComponent } from './extjscomponent';
import { Scenario, NormalizedResponse, AssertionContext } from '.';

export class ExtJSResponse extends PuppeteerResponse implements iResponse {

    public get typeName(): string {
        return 'ExtJS';
    }

    public get type(): ResponseType {
        return ResponseType.extjs;
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        // Before this scenario starts to run
        this.scenario.before(() => {
            // Prepend this as the first next
            this.scenario.nextPrepend(async (context: AssertionContext) => {
                if (context.page !== null) {
                    const exists = await context.page.evaluate(`!!window['Ext']`);
                    context.assert('ExtJS was found.', exists).equals(true);
                }
                return context.pause(1);
            });
        })
    }

    /**
     * Select the first matching element
     * 
     * @param path 
     * @param findIn 
     */
    public async find(path: string): Promise<ExtJsComponent | null> {
        if (this.page !== null) {
            const componentReference: string = `flagpole_${Date.now()}_${path.replace(/[^a-z]/ig, '')}`;
            const queryToInject: string | undefined = `window.${componentReference} = Ext.ComponentQuery.query("${path}")[0];`;
            await this.page.addScriptTag({ content: queryToInject });
            // Build array of ExtJsComponent elements
            const exists: boolean = await this.page.evaluate(`!!window.${componentReference}`);
            if (exists) {
                return await ExtJsComponent.create(
                    componentReference,
                    this.context,
                    `${path}[0]`
                )
            }
            return null;
        }
        throw new Error('Cannot evaluate code becuase page is null.');
    }

    /**
     * Select all matching elements
     * 
     * @param path 
     * @param findIn 
     */
    public async findAll(path: string): Promise<ExtJsComponent[]> {
        if (this.page !== null) {
            const componentReference: string = `flagpole_${Date.now()}_${path.replace(/[^a-z]/ig, '')}`;
            const queryToInject: string = `window.${componentReference} = Ext.ComponentQuery.query("${path}");`;
            await this.page.addScriptTag({ content: queryToInject });
            // Build array of ExtJsComponent elements
            const length: number = await this.page.evaluate(`window.${componentReference}.length`);
            let components: ExtJsComponent[] = [];
            for (let i = 0; i < length; i++) {
                components.push(
                    await ExtJsComponent.create(
                        `window.${componentReference}[${i}]`,
                        this.context,
                        `${path}[${i}]`
                    )
                )
            }
            return components;
        }
        throw new Error('Cannot evaluate code becuase page is null.');
    }

}
