import { ProtoResponse } from "./response";
import { ResponseType } from "./enums";
import { iResponse } from "./interfaces";
import { HttpResponse } from "./httpresponse";
import { CSSRule } from "./cssrule";
import { toType } from "./util";

const css = require("css");

export class CssResponse extends ProtoResponse implements iResponse {
  protected css: any;

  public get responseTypeName(): string {
    return "Stylesheet";
  }

  public get responseType(): ResponseType {
    return "stylesheet";
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.context.assert(this.statusCode).between(200, 299);
    this.context.assert(this.header("Content-Type")).contains("text/css");
    try {
      this.css = css.parse(this.body.$, { silent: true });
    } catch (ex) {
      this.css = null;
    }
    this.validate();
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public async find(path: string): Promise<CSSRule> {
    if (this.css.stylesheet && toType(this.css.stylesheet.rules) == "array") {
      const rules: any[] = this.css.stylesheet.rules;
      let matchingRule: any | null = null;
      rules.some((rule: any) => {
        if (rule.type == "rule" && rule.selectors) {
          rule.selectors.some((selector: any) => {
            if (selector == path) {
              matchingRule = rule;
            }
            return matchingRule !== null;
          });
        }
        return matchingRule !== null;
      });
      return CSSRule.create(
        matchingRule,
        this.context,
        `CSS Rule for ${path}`,
        path
      );
    }
    throw new Error("CSS is invalid");
  }

  public async findAll(path: string): Promise<CSSRule[]> {
    if (this.css.stylesheet && toType(this.css.stylesheet.rules) == "array") {
      const rules: any[] = this.css.stylesheet.rules;
      let matchingRules: CSSRule[] = [];
      rules.forEach((rule: any) => {
        if (rule.type == "rule" && rule.selectors) {
          rule.selectors.forEach((selector: any) => {
            if (selector == path) {
              const cssRule: CSSRule = CSSRule.create(
                rule,
                this.context,
                `CSS Rule for ${path}`,
                path
              );
              matchingRules.push(cssRule);
            }
          });
        }
      });
      return matchingRules;
    }
    throw new Error("CSS is invalid");
  }

  protected validate() {
    this.context
      .assert(
        "CSS is valid",
        this.css &&
          this.css.type == "stylesheet" &&
          this.css.stylesheet &&
          this.css.stylesheet.parsingErrors &&
          this.css.stylesheet.parsingErrors.length === 0
      )
      .equals(true);
  }
}
