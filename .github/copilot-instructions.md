# Copilot instructions for project-repo

This repository is a minimal Node.js scaffold. These instructions help Copilot-based sessions understand the project quickly.

1) Build, test, and lint commands
- Install dependencies: npm install
- Build (no-op in scaffold): npm run build
- Run full test suite: npm test
- Run a single test file: npm run test -- <path/to/test-file>
  - Example: npm run test -- test/sample.test.js
- Lint (ESLint): npm run lint

2) High-level architecture
- src/ contains application modules (CommonJS). Entry point: src/index.js.
- test/ contains Jest tests, organized by file. Tests import modules from ../src.
- package.json defines scripts and devDependencies (jest, eslint).
- .github/ contains repository-level configs; copilot-instructions.md is used to guide AI assistants.

3) Key conventions used here
- CommonJS modules (module.exports / require) rather than ESM.
- Tests are authored with Jest and placed under test/ with .test.js suffix.
- Single-test run: pass the test file path after the npm script (npm run test -- test/...)
- Linting assumes an existing ESLint config (not included in scaffold); add .eslintrc.js if needed.

Repository notes for Copilot sessions
- Prefer edits within src/ and test/ only; keep README, LICENSE, and .github/ stable unless requested.
- When suggesting test changes, run or describe expected jest commands and a single-file test reproduction command.

If you want, configure MCP servers for Playwright or other CI/test runners — would you like that?
