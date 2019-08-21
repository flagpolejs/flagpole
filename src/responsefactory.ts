import { HtmlResponse } from './htmlresponse';
import { ResourceResponse } from './resourceresponse';
import { BrowserResponse } from './browserresponse';
import { CssResponse } from './cssresponse';
import { ImageResponse } from './imageresponse';
import { JsonResponse } from './jsonresponse';
import { ScriptResponse } from './scriptresponse';
import { VideoResponse } from './videoresponse';
import { Scenario } from './scenario';
import { iResponse, ResponseType } from './response';
import { ExtJSResponse } from './extjsresponse';

export function createResponse(scenario: Scenario): iResponse {
    const type: ResponseType = scenario.responseType;
    let className;
    if (type == ResponseType.html) {
        className = HtmlResponse;
    }
    else if (type == ResponseType.browser) {
        className = BrowserResponse;
    }
    else if (type == ResponseType.extjs) {
        className = ExtJSResponse;
    }
    else if (type == ResponseType.stylesheet) {
        className = CssResponse;
    }
    else if (type == ResponseType.image) {
        className = ImageResponse;
    }
    else if (type == ResponseType.json) {
        className = JsonResponse;
    }
    else if (type == ResponseType.script) {
        className = ScriptResponse;
    }
    else if (type == ResponseType.video) {
        className = VideoResponse;
    }
    else {
        className = ResourceResponse;
    }
    return new className(scenario);
}