import flagpole, { AppiumResponse } from "../../../dist/index";
flagpole("Basic Smoke Test of Site", async (suite) => {
  suite
    .base("http://127.0.0.1:4723")
    .scenario("Homepage Loads", "appium", {
      deviceName: "Android Emulator",
      platformName: "Android",
      automationName: "Uiautomator2",
      app: process.env.APKPATH,
      appWaitActivity:
        "echelon_android.fitnation.viatek.com.echelon_android_new.SetupActivity",
    })
    .next(async (context) => {
      const response = context.response as AppiumResponse;
      const hello = await context.findAll("id/pager_signin_button");
      context.assert(hello[0]).exists();
      context.assert(hello.length).greaterThan(0);
      const textViews = await context.findAll(
        "class name/android.widget.TextView"
      );
      context
        .assert("textViews length is greater than 0", textViews.length)
        .greaterThan(0);
      context.comment(textViews.length);
      const onboardingTitle = await context.find("id/onboarding_page_title");
      context.assert(onboardingTitle).exists();
      context.comment(await onboardingTitle.getText());
      const privacy = await context.find(
        "id/onboarding_privacy_button",
        "Privacy"
      );
      context.assert(privacy).exists();
      const help = await context.find("", "Help");
      context.assert(help).exists();
      const attr = await help.getAttribute("resource-id");
      context.comment(attr);
      const vis = await hello[0].isVisible();
      context.assert("id/pager_signin_button is visible", vis);
      await hello[0].click();
      const login = await context.find("id/username");
      context.assert(login).exists();
      const loginField = await context.find("id/username_login");
      context.assert(loginField).exists();
      await loginField.type("ncalaway@echelonfit.com");
      await response.hideKeyboard();
      await loginField.clear();
      await loginField.type("hello@world.com");
      await loginField.clearThenType(process.env.EMAIL!);
      const passwordTexts = await context.findAll("", "Password");
      context
        .assert("passwordTexts length is greater than 0", passwordTexts.length)
        .greaterThan(0);
      context
        .assert("passwordTexts length is 1", passwordTexts.length)
        .equals(1);
      const passwordField = await context.find("id/password_login");
      await passwordField.type(process.env.PASSWORD!);
      (await context.find("id/login_button")).click();
      await context.pause(5000);
      const addUserButton = await context.find("accessibility id/add button");
      context.assert(addUserButton).exists();
      const user = await context.find("id/initials_switch_user");
      await user.click();
      await context.pause(3000);
      await response.touchMove([500, 500, 3000], [-500, -500]);
    });
});
