import flagpole from "../../../dist/index";

const suite = flagpole("Test Employee Directory Example")
  .base("https://examples.sencha.com")
  .finally(() => {
    suite.print();
  });

const browserOpts = {
  headless: false,
  width: 1280,
  height: 768,
};

const inputValues = {
  userName: "norma.flores",
  password: "wvyrEDvxI",
};

suite
  .extjs("My First ExtJS Scenario", browserOpts)
  .open("/coworkee/")
  .next("Login", async (context) => {
    const textFields = await context.findAll("textfield");
    const button = await context.find("button");
    context
      .assert("There should be two text fields", textFields)
      .length.equals(2);
    context.assert("There should be a button", button).exists();
    await textFields[0].setValue(inputValues.userName);
    await textFields[1].setValue(inputValues.password);
    context
      .assert("Text field should say LOG IN", await button.getText())
      .like("log in");
    await button.click();
    return context.waitForNavigation();
  })
  .next("Check employee listing page", async (context) => {
    context
      .assert(
        "There are multiple buttons on the page",
        await context.findAll("button")
      )
      .length.greaterThan(1);
  });
