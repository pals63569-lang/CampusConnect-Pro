# Contributing Guidelines

Thank you for contributing to CampusConnect Pro! Please follow these guidelines to keep the codebase clean, high-performing, and secure.

---

## 1. Development Workflow

1. Fork & clone the repository.
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and configure your environment.
5. Run the local development server: `npm run dev`

---

## 2. Coding Standards & Quality Controls

- **Linter**: Ensure all code passes ESLint rules before submitting: `npm run lint`
- **Formatting**: Run Prettier formatting: `npm run format`
- **Testing**: Add unit/integration tests in `tests/` for any new functionality and verify test pass rate: `npm test`

---

## 3. Pull Request Requirements

- Keep PRs focused on a single feature or bug fix.
- Ensure all CI workflow checks pass in GitHub Actions.
- Update relevant documentation (`README.md`, `API_DOCUMENTATION.md`, etc.) for any schema or route changes.
