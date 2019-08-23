import { Suite } from "../suite";
import { iConsoleLine, HeadingLine, CommentLine, LineBreak, CustomLine, ConsoleColor, HorizontalRule } from "./consoleline";
import { Flagpole } from '..';
import { Scenario } from '../scenario';
import { FlagpoleOutput, FlagpoleExecutionOptions } from '../flagpoleexecutionoptions';
import { iLogItem, LogItemType, LogItem } from './logitem';
import { LogComment } from './comment';

export class FlagpoleReport {

    public readonly suite: Suite;
    public readonly opts: FlagpoleExecutionOptions;

    constructor(suite: Suite, opts: FlagpoleExecutionOptions) {
        this.suite = suite;
        this.opts = opts;
    }

    /**
     * Get ASCII formatted string with colors from output lines, ready to go to console
     */
    public async toConsole(): Promise<iConsoleLine[]> {

        let lines: iConsoleLine[] = [];
        lines.push(new HorizontalRule('='));
        lines.push(new HeadingLine(this.suite.title));
        lines.push(new HorizontalRule('='));
        lines.push(new CommentLine(`Base URL: ${this.suite.baseUrl}`));
        lines.push(new CommentLine(`Environment: ${Flagpole.executionOpts.environment}`));
        lines.push(new CommentLine(`Took ${this.suite.executionDuration}ms`));

        let color: ConsoleColor = this.suite.hasPassed ? ConsoleColor.FgGreen : ConsoleColor.FgRed;
        lines.push(new CustomLine(` »   Passed? ${(this.suite.hasPassed ? 'Yes' : 'No')}`, color));
        lines.push(new LineBreak());

        await Flagpole.forEach(this.suite.scenarios, async (scenario: Scenario) => {
            const log = await scenario.getLog();
            log.forEach((item: iLogItem) => {
                lines = lines.concat(item.toConsole());
            });
            lines.push(new LineBreak());
        });
        
        return lines;
    }

    /**
     * Get JSON output
     *
     * @returns {any}
     */
    public async toJson(): Promise<any> {
        const scenarios: Scenario[] = this.suite.scenarios;
        let out: any = {
            title: this.suite.title,
            baseUrl: String(this.suite.baseUrl),
            summary: {},
            scenarios: []
        };
        let failCount: number = 0;
        let passCount: number = 0;
        for (let i = 0; i < scenarios.length; i++) {
            let scenario: Scenario = scenarios[i];
            const log: iLogItem[] = await scenario.getLog();
            out.scenarios[i] = {
                title: scenario.title,
                done: scenario.hasFinished,
                failCount: 0,
                passCount: 0,
                log: []
            };
            log.forEach((item: iLogItem) => {
                out.scenarios[i].log.push(item.toJson());
                if (item.type == LogItemType.Result) {
                    if (item.passed) {
                        out.scenarios[i].passCount++;
                        passCount++;
                    }
                    else if (item.failed && item.isOptional) {
                        out.scenarios[i].failCount++;
                        failCount++;
                    }
                }
            });
        }
        out.summary = {
            passed: (failCount == 0),
            passCount: passCount,
            failCount: failCount,
            duration: this.suite.executionDuration
        }
        return out;
    }

    /**
     * Create HTML output for results
     */
    public async toHTML(): Promise<string> {
        const scenarios: Scenario[] = this.suite.scenarios;
        let html: string = '';
        html += '<article class="suite">' + "\n";
        html += `<h2>${this.suite.title}</h2>\n`;
        html += "<aside>\n";
        html += "<ul>\n";
        html += `
            <li>Duration: ${this.suite.executionDuration}ms</li>
            <li>Base URL: ${this.suite.baseUrl}</li>
            <li>Environment: ${Flagpole.executionOpts.environment}</li>
        `;
        html += "</ul>\n";
        html += "</aside>\n";
        for (let i = 0; i < scenarios.length; i++) {
            let scenario: Scenario = scenarios[i];
            const log = await scenario.getLog();
            html += '<section class="scenario">' + "\n";
            html += `
                <h3>${scenario.title}</h3>
            `;
            html += "<ul>\n";
            log.forEach((item: iLogItem) => {
                if (item.type == LogItemType.Result || item.type == LogItemType.Comment) {
                    html += item.toHtml();
                }
            });
            html += "</ul>\n";
            html += "</section>\n";
        }
        html += "</article>\n";
        return html;
    }

    public async toDelimited(format: string): Promise<string[]> {
        const funcName: string = `to${format.charAt(0).toUpperCase()}${format.slice(1)}`;
        if (!Reflect.has(new LogComment(''), funcName)) {
            throw new Error(`Method for ${funcName} does not exist.`);
        }
        let lines: string[] = [];
        await this.suite.scenarios.forEach(async function (scenario) {
            const log = await scenario.getLog();
            log.forEach((item: iLogItem) => {
                lines.push(item[funcName]());
            });
        });
        return lines;
    }

    public async print(): Promise<any> {
        console.log(await this.toString());
    }

    public async toString(): Promise<string> {
        let out: string = '';
        // HTML
        if (
            this.opts.output == FlagpoleOutput.html ||
            this.opts.output == FlagpoleOutput.browser
        ) {
            out += await this.toHTML();
        }
        // JSON
        else if (this.opts.output == FlagpoleOutput.json) {
            const json: any = await this.toJson();
            out += JSON.stringify(json, null, 2);
        }
        // Console
        else if (this.opts.output == FlagpoleOutput.console) {
            (await this.toConsole()).forEach((line: iConsoleLine) => {
                out +=line.toConsoleString() + "\n";
            });
        }
        // Text
        else if (this.opts.output == FlagpoleOutput.text) {
            (await this.toConsole()).forEach((line: iConsoleLine) => {
                out += line.toString() + "\n";
            });
        }
        // CSV
        else if (
            this.opts.output == FlagpoleOutput.csv ||
            this.opts.output == FlagpoleOutput.psv ||
            this.opts.output == FlagpoleOutput.tsv
        ) {
            const format: string = FlagpoleOutput[this.opts.output];
            (await this.toDelimited(format)).forEach((line: string) => {
                out += line + "\n";
            })
        }
        return out;
    }


}