import flagpole, { HtmlScenario } from "../../../dist/index";

flagpole("Stack Overflow")
  .base("http://www.stackoverflow.com")
  .finally(function (suite) {
    suite.print();
  })
  .scenario("Homepage", HtmlScenario)
  .open("/")
  .next("Check basic parameters", async function (context) {
    context.assert(context.response.statusCode).equals(200);
    context
      .assert(context.response.header("content-type"))
      .contains("text/html");
    const title = await context.find("title");
    context.assert(await title.getText()).contains("Stack Overflow");
  })
  .next("Test the top navigation bar", async function (context) {
    context
      .assert((await context.findAll(".top-bar .-ctas")).length)
      .greaterThan(0);
    const loginLink = await context.find("a.login-link");
    context.assert(loginLink).exists();
    context.assert(await loginLink.getText()).like("Log In");
  });
/*
    .next('There should be questions', function () {
        context.response
            .select('.question-summary')
            .and().length().greaterThan(5)
            .select('.question-summary').first()
            .and().find('.views span').exists()
            .and().text().parseInt().greaterThan(0)
            .select('.question-summary').nth(2)
            .and().find('.status span').exists()
            .and().text().parseInt().greaterThanOrEquals(0);
    })
    .next('Test that each image exists', function () {
        context.response.select('img').each(function (img, index) {
            img.load('Image ' + index, true);
        });
    })
    .next('Test that the stylesheets exist', function () {
        context.response.select('link[rel="stylesheet"]').each(function (link, index) {
            link.load('Stylesheet ' + index, true);
        });
    })
    .next('Test that the javascript files exist', function () {
        context.response.select('script[src]').each(function (script, index) {
            script.load('Script ' + index, true);
        })
    })
    */
