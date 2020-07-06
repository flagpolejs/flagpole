import flagpole from "../../dist/index";
import { exists } from "fs-extra";

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
      .assert("Text field should say LOG IN", await button.getText())
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
    const recent = await context.findHavingText("button", "Recent");
    context.assert(recent).exists();
    return recent.click();
  })
  .next("Recent page", async (context) => {
    await context.pause(3000);
    const contactTile = await context.find(".x-dataview-item .person-name");
    context.assert(contactTile).exists();
    return contactTile.click();
  })
  .next("Detail page", async (context) => {
    const btnEdit = await context.findHavingText("button", "edit");
    context.assert(btnEdit).exists();
    await context.pause(1000);
    return btnEdit.click();
  })
  .next("Edit page", async (context) => {
    await context.pause(3000);
  });
