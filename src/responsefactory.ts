import { HtmlResponse } from './htmlresponse';
import { ResourceResponse } from './resourceresponse';
import { BrowserResponse } from './browserresponse';
import { CssResponse } from './cssresponse';
import { ImageResponse } from './imageresponse';
import { JsonResponse } from './jsonresponse';
import { ScriptResponse } from './scriptresponse';
import { VideoResource } from './videoresource';
import { Scenario } from './scenario';
import { NormalizedResponse, iResponse, ResponseType } from './response';

export function createResponse(scenario: Scenario, response: NormalizedResponse): iResponse {
    const type: ResponseType = scenario.getResponseType();
    let className;
    if (type == ResponseType.html) {
        className = HtmlResponse;
    }
    else if (type == ResponseType.browser) {
        className = BrowserResponse;
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
        className = VideoResource;
    }
    else {
        className = ResourceResponse;
    }
    return new className(scenario, response);
}