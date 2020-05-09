import { Flagpole } from "../../dist/index.js";

const suite = Flagpole.suite("Test order of callbacks")
  .base("https://www.whatismyip.com")
  .beforeAll(() => {
    console.log("Before All");
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Resolved Before All");
        resolve();
      }, 1000);
    });
  })
  .beforeEach(() => {
    console.log("Before Each");
  })
  .afterEach(() => {
    console.log("After Each");
  })
  .afterAll(() => {
    console.log("After All");
  })
  .success(() => {
    console.log("Suite Success");
  })
  .failure(() => {
    console.log("Suite Failure");
  })
  .finally(() => {
    console.log("Suite Finally");
  })
  .subscribe((suite, status) => {
    console.log(`suite: ${status}`);
  });

suite
  .html("Main Page")
  .open("/")
  .before(() => {
    console.log("Before First Scenario");
  })
  .after(() => {
    console.log("After First Scenario");
  })
  .success(() => {
    console.log("Success First Scenario");
  })
  .failure(() => {
    console.log("Failure First Scenario");
  })
  .finally(() => {
    console.log("Finally First Scenario");
  })
  .next(async function () {
    console.log("Next First Scenario");
  })
  .subscribe((scenario, status) => {
    console.log(`scenario 1: ${status}`);
  });

suite
  .html("IP Lookup")
  .open("/ip-address-lookup/")
  .before(() => {
    console.log("Before Second Scenario");
  })
  .after(() => {
    console.log("After Second Scenario");
  })
  .success(() => {
    console.log("Success Second Scenario");
  })
  .failure(() => {
    console.log("Failure Second Scenario");
  })
  .finally(() => {
    console.log("Finally Second Scenario");
  })
  .next(async function () {
    console.log("Next Second Scenario");
  })
  .subscribe((scenario, status) => {
    console.log(`scenario 2: ${status}`);
  });

suite
  .html("Change IP")
  .open("/how-to-change-your-ip-address/")
  .before(() => {
    console.log("Before Third Scenario");
  })
  .after(() => {
    console.log("After Third Scenario");
  })
  .success(() => {
    console.log("Success Third Scenario");
  })
  .failure(() => {
    console.log("Failure Third Scenario");
  })
  .finally(() => {
    console.log("Finally Third Scenario");
  })
  .next(async function () {
    console.log("Next Third Scenario");
  })
  .subscribe((scenario, status) => {
    console.log(`scenario 3: ${status}`);
  });
