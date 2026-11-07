# Contributing to `ctxpack`

Thank you for your interest in contributing to `ctxpack`! We love contributions from the community.

## 🛠️ Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/abzurdd/ctxpack.git
   cd ctxpack
   ```

2. Because `ctxpack` has zero external dependencies, no `npm install` is required! All you need is Node.js 18 or newer.

3. Run the automated test suite:
   ```bash
   npm test
   ```

## 📐 Guidelines

- **Zero dependencies philosophy**: Keep core dependencies at 0 whenever possible. Use standard Node.js APIs (`fs`, `path`, `child_process`).
- **Safety first**: Never weaken default secret redaction logic.
- **Write tests**: Any new feature or bug fix should include a test under the `test/` directory.

## 🚀 Submitting a Pull Request

1. Create a feature branch: `git checkout -b feature/my-new-feature`
2. Commit your changes: `git commit -m 'feat: add support for XYZ'`
3. Push to the branch: `git push origin feature/my-new-feature`
4. Open a Pull Request on GitHub.
