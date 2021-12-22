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
      devProperties: {
        location: {
          latitude: 40.71278,
          longitude: -74.00611,
          altitude: 1,
        },
        network: {
          wifi: true,
          mobileData: true,
          locationServices: true,
          airplaneMode: false,
        },
      },
    })
    .next(async (context) => {
      const response = context.response as AppiumResponse;
      const geolocation = await response.getGeolocation();
      context.assert(geolocation.latitude).equals(40.71278);
      context.assert(geolocation.longitude).equals(-74.00611);
      context.assert(geolocation.altitude).equals(1);
      let screenProps = await context.getScreenProperties();
      context.assert(screenProps.angle).equals("PORTRAIT");
      let rotation = await context.rotateScreen("LANDSCAPE");
      context.assert(rotation).equals("LANDSCAPE");
      screenProps = await context.getScreenProperties();
      context.assert(screenProps.angle).equals("LANDSCAPE");
      rotation = await context.rotateScreen("PORTRAIT");
      let devProps = await response.getDeviceProperties();
      context.assert(devProps.network.wifi).equals(true);
      context.assert(devProps.network.mobileData).equals(true);
      context.assert(devProps.network.locationServices).equals(true);
      context.assert(devProps.network.airplaneMode).equals(false);
      await response.setDeviceProperties({
        network: {
          mobileData: false,
        },
      });
      devProps = await response.getDeviceProperties();
      context.assert(devProps.network.mobileData).equals(false);
      const pageSource = await response.getSource();
      context.assert(pageSource.length).greaterThan(0);
      const isInstalled = await response.isAppInstalled(
        "com.viatek.fitnation.echelon_android.staging"
      );
      context.assert(isInstalled).equals(true);
      await response.backgroundApp(3);
      await context.pause(3000);
      await response.terminateApp(
        "com.viatek.fitnation.echelon_android.staging"
      );
      await response.launchApp();
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
      await help.click();
      await (await context.find("id/help_help_center_text")).click();
      const appiumContexts = await response.getAppiumContexts();
      context.assert(appiumContexts.length).equals(2);
      await response.setAppiumContext(appiumContexts[1]);
      const navbar = await context.waitForExists("css selector/.nav-bar");
      context
        .assert("navbar has width", await navbar.getProperty("width"))
        .greaterThan(0);
      await response.setAppiumContext(appiumContexts[0]);
      await response.goBack();

      const hello = await context.findAll("id/pager_signin_button");
      context.assert(hello[0]).exists();
      context.assert(hello.length).greaterThan(0);
      const vis = await hello[0].isVisible();
      context.assert("id/pager_signin_button is visible", vis);
      const screenshot = await hello[0].screenshot();
      context.assert(screenshot).exists();
      const bounds = await hello[0].getBounds();
      context.comment(bounds);
      await hello[0].click();
      const login = await context.find("id/username");
      context.assert(login).exists();
      const loginField = await context.find("id/username_login");
      context.assert(loginField).exists();
      await loginField.type("ncalaway@echelonfit.com");
      await context.hideKeyboard();
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
      const passwordField = await context.waitForVisible("id/password_login");
      await passwordField.type(process.env.PASSWORD!);
      (await context.find("id/login_button")).click();
      const addUserButton = await context.waitForExists(
        "accessibility id/add button",
        6000
      );
      context.assert(addUserButton).exists();
      const user = await context.find("id/initials_switch_user");
      await user.click();
      await context.pause(3000);
      await context.movePointer({
        start: [500, 500],
        end: [0, 0],
        duration: 3000,
      });
      const helloAgain = await context.find("id/pager_signin_button");
      context.assert(helloAgain).exists();
    });
});
