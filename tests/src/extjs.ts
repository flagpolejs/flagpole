import flagpole from "../../dist/index";

const browserOpts = {
  headless: false,
  width: 1280,
  height: 768,
};

const inputValues = {
  userName: "norma.flores",
  password: "wvyrEDvxI",
};

const suite = flagpole("Ext JS").base("https://examples.sencha.com/");

/*
suite
  .scenario("Basic", "extjs", browserOpts)
  .open("GET /coworkee/")
  .next("Smoke", async (context) => {
    //await context.waitForExists("#ext-formpanel-1");
    const textFields = await context.findAll("textfield");
    const tag = await textFields[0].getTagName();
    const value = await textFields[0].getValue();
    context.assert(textFields).length.equals(2);
    context.assert(tag).equals("textfield");
    context.comment(value);
  });
*/

suite
  .scenario("Test ExtJS", "extjs", browserOpts)
  .open("GET /coworkee/")
  .next("Login", async (context) => {
    await context.waitForExists("#ext-formpanel-1");
    const textFields = await context.findAll("textfield");
    const button = await context.exists("button");
    context
      .assert("There should be two text fields", textFields)
      .length.equals(2);
    context
      .assert("Button should say LOG IN", await button.getText())
      .like("log in");
    await textFields[0].type(inputValues.userName);
    await textFields[1].type(inputValues.password);
    await button.click();
    return context.page?.waitForNavigation();
  })
  .next("Check employee listing page", async (context) => {
    const buttons = await context.findAll("button");
    context
      .assert("There are multiple buttons on the page", buttons)
      .length.greaterThan(1);
    await context.pause(1000);
    const recent = await context.find("button", "Recent");
    context.assert(recent).exists();
    return recent.click();
  })
  .next("Recent page", async (context) => {
    await context.pause(1000);
    const contactTile = await context.find(".x-dataview-item .person-name");
    context.assert(contactTile).exists();
    const contactComponent = await contactTile.getAncestorOrSelf(
      ".x-component"
    );
    return contactTile.click();
  })
  .next("Detail page", async (context) => {
    await context.pause(1000);
    const btnEdit = await context.find("button", "edit");
    context.assert(btnEdit).exists();
    return btnEdit.click();
  })
  .next("Edit page", async (context) => {
    await context.pause(1000);
    const firstName = await context.find("field", "first name");
    context.assert(firstName).exists();
    await firstName.type("foo");
    const cmp = await firstName.getAncestorOrSelf("*");
    context.assert(cmp).exists();
    context.assert(await cmp.eval((c) => c.getLabel())).equals("First Name");
    await context.pause(1000);
    const workTab = await context.find("button", "work");
    context.assert(workTab).exists();
    await workTab.click();
    await context.pause(1000);
    const officeField = await context.find("field", "office");
    officeField.selectOption("Dryden");
    await context.pause(3000);
  });
