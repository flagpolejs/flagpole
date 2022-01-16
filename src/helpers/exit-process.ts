export function exitProcess(passed: boolean) {
  process.exit(passed ? 0 : 1);
}
