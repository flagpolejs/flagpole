import { HttpResponse } from "../http-response";
import { iResponse } from "../interfaces/iresponse";
import { XmlResponse } from "./xml-response";
import { ScenarioType } from "../scenario-types";

const validMimeTypes = [
  "application/soap+xml",
  "text/xml",
  "text/soap+xml",
  "application/wsdl+xml",
  "text/wsdl+xml",
];

export class SoapResponse extends XmlResponse implements iResponse {
  public get responseTypeName(): string {
    return "SOAP";
  }

  public get responseType(): ScenarioType {
    return "soap";
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.context.assert(this.statusCode).between(200, 299);
    const mimeType = String(this.header("Content-Type").$)
      .split(";")
      .shift()
      ?.trim();
    this.context
      .assert(
        `Mime Type is valid for SOAP (${validMimeTypes.join(", ")})`,
        mimeType
      )
      .in(validMimeTypes);
    if (this.hasRequiredSoapFields()) {
      this.context.assert("Has required SOAP fields", true).equals(true);
    }
  }

  private hasRequiredSoapFields(): boolean {
    const root = this.cheerio.root().children()[0];
    const rootName: string = root["name"];
    const rootParts = rootName.split(":");
    const prefix = rootParts.length == 1 ? null : rootParts[0];
    const envTag = prefix === null ? "Envelope" : `${prefix}\\:Envelope`;
    const bodyTag = prefix === null ? "Body" : `${prefix}\\:Body`;
    // Root element must be envelope
    if (rootParts.length == 0 || rootParts.length > 2 || rootName == envTag) {
      this.context.logFailure(`Root element is <${envTag}>`, rootName);
      return false;
    }
    // Must be one envelope
    const envelope = this.cheerio(envTag);
    if (envelope.length !== 1) {
      this.context.logFailure(`Found envelope tag <${envTag}>`);
      return false;
    }
    // Envelope must have body
    const body = envelope.children(bodyTag);
    if (body.length !== 1) {
      this.context.logFailure(`<${envTag}> contains child <${bodyTag}>`);
      return false;
    }
    // Made it this far? Valid;
    return true;
  }
}
