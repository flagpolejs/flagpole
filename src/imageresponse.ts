import { iResponse, GenericResponse, SimplifiedResponse } from "./response";
import { Scenario } from "./scenario";

export class ImageResponse extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.status().between(200, 299);
        this.headers('Content-Type')
            .label('MIME Type matches expected value for an image')
            .startsWith('image/');
    }

}
