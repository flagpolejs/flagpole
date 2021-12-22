# Further Setup

## Installing other dependencies

In order to keep the core library relatively trim, we don't want to ship Flagpole with some dependencies that you might not use. So where possible we have left them out and load them dynamically if present.

### Puppeteer

If you are going to do full browser testing, you will probably want to install [Puppeteer](https://pptr.dev/) in your project install it as well, as a dev dependency.

```cli
npm i puppeteer --save-dev
```


### Appium

If you are going to test a mobile app, you will need to install Appium globally, either as an npm package or as an app.

```cli
npm i -g appium
```

or download [here](https://github.com/appium/appium-desktop/releases/latest)

Run the Appium server before executing any Appium tests. Also, make sure the device, emulator, or simulator under test is connected and available.

To setup an Android emulator for testing, install [Android Studio](https://developer.android.com/studio/). Make sure when you run the installer that an Android Virtual Device (AVD) is selected for installation under the custom installation options. Once Android Studio is up and running, click on the menu item Tools and select AVD Manager. From this screen you can create your Android emulator. 
Appium should recognize the emulator without any addtional configuration, but if you want to run multiple tests in parallel, specify the device UDID in the session capabilities.
You can get the device UDID by running `adb devices` from a terminal emulator. The capability for the device UDID is simply `udid`.

To setup an iOS device or simulator for testing, install [Xcode](https://developer.apple.com/xcode/). Create a new app in Xcode and install a developer certificate for Apple development.
Check the simulators available in Xcode from the center, top portion of the Xcode window. Use those simulator names as the values for the `deviceName` capabilitiy.
Refer [here](https://appium.io/docs/en/drivers/ios-xcuitest-real-devices/) for real devices.

```javascript
Add the desired capabilities to each scenario like so:
flagpole("Basic Smoke Test of App", async (suite) => {
  suite
    .scenario("Basic smoke test", "appium", {
      capabilities: {
        deviceName: "Android Emulator",
        platformName: "Android",
        automationName: "Uiautomator2",
        app: "/path/to/apk/or/ipa"
      }
    });
  });
```

See [here](https://appium.io/docs/en/writing-running-appium/caps/) for more information on setting capabilities.

You may also pass device properties as another subproperty of the third argument. Currently, only geolocation is capable of being set this way.

```javascript
flagpole("Basic Smoke Test of App", async (suite) => {
  suite
  .scenario("Basic smoke test", "appium", {
    capabilities: {
      deviceName: "Android Emulator",
      platformName: "Android",
      automationName: "Uiautomator2",
      app: "/path/to/apk/or/ipa"
    },
    devProperties: {
      location: {
        latitude: 121.21,
        longitude: 11.56,
        altitude: 94.23
      },
      network: {
        wifi: true,
        mobileData: true,
        locationServices: true,
        airplaneMode: false
      }
    }
  });
});
```


### TypeScript

Writing tests with TypeScript is possible. During `flagpole init` the CLI will ask if you want to use TypeScript:

> Do you want Flagpole to use TypeScript?

Selecting yes will prompt you for source and output directories. The default setup looks like this:

```
tests/
  cache/
  images/
  out/
  reports/
  scehmas/
  src/
  tsconfig.json
```

You can then compile your suites like so:

```
flagpole build
flagpole run --all
```

or

```
flagpole run --build --all
```

If you want to instead build your tests with the rest of your TypeScript app, you may do so as such:

```
"path": "/",
"source": "src/tests",
"output": "dist/tests",
```

Then rely on your project's `tsconfig.json` to compile from `src/` to `dist/`

Note: TypeScript version >= 4.2.3 is required.
