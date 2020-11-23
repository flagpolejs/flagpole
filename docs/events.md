# Events

This is the rough order that they will fire in:

- Suite.beforeAll
- Suite.beforeEach
- Scenario.before
- Scenario.next
- Suite.afterEach
- Scenario.after
- Scenario.success | Scenario.failure | Scenario.error
- Suite.afterAll
- Scenario.finally
- Suite.success | Suite.failure | Suite.error
- Suite.finally

## Scenario.after()

This will fire just after this Scenario has finished executing and marked completed, but before the success/failure/error or finally.

## Scenario.before()

This will fire just after this Scenario has been marked started, but before it actually starts the request.

## Scenario.error()

This is called after the Scenario.after and before Scenario.finally, but only if the Scenario fails with an uncaught exception.

## Scenario.failure()

This is called after the Scenario.after and before Scenario.finally, but only if the Scenario fails at least one assertion.

## Scenario.finally()

This is called as the last thing after the Scenario has completed, whether it passes or fails. This will be after success/failure/error.

## Scenario.success()

This is called after the Scenario.after and before Scenario.finally, but only if the Scenario passes.

## Suite.afterAll()

This will run after the last Scenario.after, so at this point all Scenarios are completed and the Suite will have just been marked completed.

## Suite.afterEach()

This will run as soon as each scenario is marked completed. The scenario is passed in as the callback argument.

## Suite.beforeAll()

This will always run before anything else executes. Therefore, it's a great place to do some setup. If you return a promise then the execution of the next steps will wait until that promise is resolved. You can chain multiple beforeAlls if you like.

```javascript
flagpole('Test order of callbacks', (suite) => {}
    suite
        .beforeAll(() => {
            return new Promise((resolve) => {
                // Wait one second before executing the first scenario
                setTimeout(resolve, 1000);
            });
        })
        // Chain another one
        .beforeAll(() => {
            return new Promise((resolve) => {
                // Actually wait another second
                setTimeout(resolve, 1000);
            });
        })
});
```

## Suite.beforeEach()

This will run after each scenario has been marked as started, but before the request actually gets called. The scenario is passed in as the callback argument.

```javascript
flagpole("Test order of callbacks", (suite) => {
  suite.beforeEach((scenario) => scenario.setBearerToken(token));
});
```

## Suite.error()

If any scenarios failed with an unhandled error, this will run after Suite.afterAll and before Suite.finally.

## Suite.failure()

If any scenarios failed, this will run after Suite.afterAll and before Suite.finally.

## Suite.finally()

This will always be the last thing to run. The suite and all scenarios will be completed at that point, whether they succeeded or failed.

## Suite.success()

If all scenarios passed, this will run after Suite.afterAll and before Suite.finally.
