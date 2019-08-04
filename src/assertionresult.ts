

export class AssertionResult {

    public readonly passed: boolean;
    public readonly message: string;
    public readonly isOptional: boolean;

    public static failOptional(message: string): AssertionResult {
        return new AssertionResult(
            false, message, true
        );
    }

    public static fail(message: string): AssertionResult {
        return new AssertionResult(
            false, message, false
        );
    }

    public static pass(message: string): AssertionResult {
        return new AssertionResult(
            true, message, false
        );
    }

    private constructor(passed: boolean, message: string, isOptional: boolean) {
        this.passed = passed;
        this.message = message;
        this.isOptional = isOptional;
    }


}