export function main(): void {
  console.log('Hello, TypeScript!');
}

if (require.main === module) {
  main();
}