import { iResponse, GenericResponse } from "./response";
import { Browser } from './browser';
import { Page } from 'puppeteer';
import { iValue } from '.';

export abstract class PuppeteerResponse extends GenericResponse implements iResponse {

    /**
     * Is this a browser based test
     */
    public get isBrowser(): boolean {
        return true;
    }

    public get browser(): Browser {
        return this.scenario.getBrowser();
    }

    public get page(): Page | null {
        return this.scenario.getBrowser().getPage();
    }

    public abstract async find(path: string): Promise<iValue | null>
    public abstract async findAll(path: string): Promise<iValue[]>

    /**
     * Runt his code in the browser
     */
    public async evaluate(context: any, callback: Function): Promise<any> {
        if (this.page !== null) {
            const functionName: string = `flagpole_${Date.now()}`;
            const jsToInject: string = `window.${functionName} = ${callback}`;
            await this.page.addScriptTag({ content: jsToInject });
            return await this.page.evaluate(functionName => {
                // @ts-ignore This is calling into the browser, so don't do an IDE error
                return window[functionName]();
            }, functionName);
        }
        throw new Error('Cannot evaluate code becuase page is null.');
    }

}
