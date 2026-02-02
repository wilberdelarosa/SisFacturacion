# Description
Please include a summary of the change and which issue is fixed.

## Type of change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] 🚀 New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 🚜 Refactor (no functionality change)

# Checklist:

## 📐 Architecture
- [ ] I have followed the Hexagonal Architecture rules.
- [ ] I have **NOT** imported `Infrastructure` into `Domain`.
- [ ] I have used the `Result` monad for error handling.

## 🧪 Quality
- [ ] My code follows the style guidelines of this project.
- [ ] I have performed a self-review of my own code.
- [ ] I have added tests that prove my fix is effective or that my feature works.
- [ ] I have run `pnpm check:arch` and it passed.

## 📝 Documentation
- [ ] I have updated the documentation (if applicable).
- [ ] I have updated the Architecture Diagram (if applicable).
