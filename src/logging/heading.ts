import { LogItem, LogItemType } from './logitem';


export class LogSuiteHeading extends LogItem {

    public readonly type = LogItemType.Heading;
    public readonly className = "heading";

    public toHtml(): string {
        return `
            <h1>${this.message}</h1>
        `;
    }

}

export class LogScenarioHeading extends LogSuiteHeading {

    public toHtml(): string {
        return `
            <h2>${this.message}</h2>
        `;
    }

}

export class LogScenarioSubHeading extends LogSuiteHeading {

    public toHtml(): string {
        return `
            <li>
                <strong>${this.message}</strong>
            </li>
        `;
    }

}
