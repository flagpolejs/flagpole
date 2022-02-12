import flagpole, { SoapScenario } from "../../dist/index";

flagpole("SOAP Service", (suite) => {
  suite
    .scenario("Convert Temperature", SoapScenario)
    .open("https://www.w3schools.com/xml/tempconvert.asmx")
    .setRawBody(
      `<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
        <soap12:Body>
            <CelsiusToFahrenheit xmlns="https://www.w3schools.com/xml/">
            <Celsius>20</Celsius>
            </CelsiusToFahrenheit>
        </soap12:Body>
        </soap12:Envelope>`
    )
    .next(async (context) => {
      context.comment(context.response.body);
      const result = await context.exists("CelsiusToFahrenheitResult");
      context.assert(await result.getInnerText()).equals(68);
    });
});
