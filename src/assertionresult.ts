

export class AssertionResult {

    public readonly passed: boolean;
    public readonly message: string;
    public readonly isOptional: boolean;
    public readonly details: string | null = null;

    public static failOptional(message: string, details?: string): AssertionResult {
        return new AssertionResult(
            false, message, true, details
        );
    }

    public static fail(message: string, details?: string): AssertionResult {
        return new AssertionResult(
            false, message, false, details
        );
    }

    public static pass(message: string): AssertionResult {
        return new AssertionResult(
            true, message, false
        );
    }

    private constructor(passed: boolean, message: string, isOptional: boolean, details?: string) {
        this.passed = passed;
        this.message = message;
        this.isOptional = isOptional;
        this.details = details || null;
    }


}