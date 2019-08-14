import { URL } from 'url';
import { Suite } from "./suite";
import { iLogLine, LogLineType, HeadingLine, DecorationLine, CommentLine, LineBreak, CustomLine, ConsoleColor, SubheadingLine, LogLine, HorizontalRule } from "./consoleline";
import { Flagpole } from '.';
import { Scenario } from './scenario';
import { FlagpoleOutput } from './flagpole';

export class FlagpoleReport {

    public readonly suite: Suite;

    constructor(suite: Suite) {
        this.suite = suite;
    }

    /**
     * Get raw output line objects
     */
    public async getLines(): Promise<iLogLine[]> {
        let lines: iLogLine[] = [];
        lines.push(new HorizontalRule('='));
        lines.push(new HeadingLine(this.suite.title));
        lines.push(new HorizontalRule('='));
        lines.push(new CommentLine('Base URL: ' + this.suite.baseUrl));
        lines.push(new CommentLine('Environment: ' + Flagpole.getEnvironment()));
        lines.push(new CommentLine('Took ' + this.suite.executionDuration + 'ms'));

        let color: ConsoleColor = this.suite.hasPassed ? ConsoleColor.FgGreen : ConsoleColor.FgRed;
        lines.push(new CustomLine(' »   Passed? ' + (this.suite.hasPassed ? 'Yes' : 'No'), color));
        lines.push(new LineBreak());

        await this.suite.scenarios.forEach(async function (scenario) {
            const log = await scenario.getLog();
            log.forEach(function (line: iLogLine) {
                lines.push(line);
            });
            lines.push(new LineBreak());
        });

        return lines;
    }

    /**
     * Get ASCII formatted string with colors from output lines, ready to go to console
     */
    public async toConsoleString(): Promise<string> {
        const lines = await this.getLines();
        let text: string = '';
        lines.forEach(function (line: iLogLine) {
            text += line.toConsoleString() + "\n";
        });
        return text;
    }

    /**
     * Get string without any ASCII colors
     */
    public async toRawString(): Promise<string> {
        const lines = await this.getLines();
        let text: string = '';
        lines.forEach(function (line: iLogLine) {
            text += line.toString() + "\n";
        });
        return text;
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
            baseUrl: this.suite.baseUrl,
            summary: {},
            scenarios: []
        };
        let failCount: number = 0;
        let passCount: number = 0;
        for (let i = 0; i < scenarios.length; i++) {
            let scenario: Scenario = scenarios[i];
            const log = await scenario.getLog();
            out.scenarios[i] = {
                done: scenario.hasFinished,
                failCount: 0,
                passCount: 0,
                log: []
            };
            log.forEach(function (line: iLogLine) {
                out.scenarios[i].log.push(line.toJson());
                if (line.type == LogLineType.Pass) {
                    out.scenarios[i].passCount++;
                    passCount++;
                }
                else if (line.type == LogLineType.Fail) {
                    out.scenarios[i].failCount++;
                    failCount++;
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
        html += new HeadingLine(this.suite.title).toHTML() + "\n";
        html += "<aside>\n";
        html += "<ul>\n";
        html += new CommentLine('Duration: ' + this.suite.executionDuration + 'ms').toHTML();
        html += new CommentLine('Base URL: ' + this.suite.baseUrl).toHTML();
        html += new CommentLine('Environment: ' + Flagpole.getEnvironment()).toHTML();
        html += "</ul>\n";
        html += "</aside>\n";
        for (let i = 0; i < scenarios.length; i++) {
            let scenario: Scenario = scenarios[i];
            const log = await scenario.getLog();
            html += '<section class="scenario">' + "\n";
            html += new SubheadingLine(scenario.title).toHTML() + "\n";
            html += "<ul>\n";
            log.forEach(function (line: iLogLine) {
                if (
                    line.type == LogLineType.Pass ||
                    line.type == LogLineType.Fail ||
                    line.type == LogLineType.Comment
                ) {
                    html += line.toHTML();
                }
            });
            html += "</ul>\n";
            html += "</section>\n";
        }
        html += "</article>\n";
        return html;
    }

    public async print(): Promise<FlagpoleReport> {
        const lines = await this.getLines();
        // Log style output ignores any decoration lines
        if (Flagpole.logOutput) {
            lines.forEach(function (line: iLogLine) {
                if (line.type != LogLineType.Decoration) {
                    line.print();
                }
            });
        }
        // Normal style printing
        else {
            // HTML
            if (
                Flagpole.output == FlagpoleOutput.html ||
                Flagpole.output == FlagpoleOutput.browser
            ) {
                console.log(await this.toHTML());
            }
            // JSON
            else if (Flagpole.output == FlagpoleOutput.json) {
                console.log(JSON.stringify(await this.toJson(), null, 2));
            }
            // Some sort of text format
            else {
                lines.forEach(function (line: iLogLine) {
                    line.print();
                });
            }
        }
        return this;
    }


}