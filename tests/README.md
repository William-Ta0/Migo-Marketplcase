# Migo Marketplace Test Suite

A comprehensive testing framework for the Migo Marketplace application covering unit tests, integration tests, and end-to-end functionality testing.

## 📁 Directory Structure

```
tests/
├── setup.js                    # Global test configuration and mocks
├── package.json                # Test dependencies and Jest configuration
├── backend/                    # Backend tests
│   ├── models/                 # Model unit tests
│   │   ├── User.test.js        # User model validation & functionality
│   │   ├── Service.test.js     # Service model validation & functionality
│   │   └── Job.test.js         # Job model validation & functionality
│   ├── controllers/            # Controller unit tests
│   │   ├── userController.test.js      # User API endpoints
│   │   ├── serviceController.test.js   # Service API endpoints
│   │   └── jobController.test.js       # Job API endpoints
│   ├── routes/                 # Route tests
│   └── middleware/             # Middleware tests
├── frontend/                   # Frontend tests
│   ├── components/             # Component unit tests
│   │   ├── Header.test.js      # Header component functionality
│   │   ├── ServiceCard.test.js # Service display component
│   │   └── JobTracker.test.js  # Job tracking component
│   └── pages/                  # Page component tests
└── integration/                # Integration tests
    └── userServiceIntegration.test.js  # Full user journey tests
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd tests
npm install
```

### 2. Run All Tests

```bash
# From the root project directory
node run-tests.js
```

### 3. Run Specific Test Categories

```bash
# Backend tests only
node run-tests.js --backend

# Frontend tests only
node run-tests.js --frontend

# Integration tests only
node run-tests.js --integration

# Unit tests only (backend + frontend, excluding integration)
node run-tests.js --unit
```

## 🧪 Test Categories

### Unit Tests

**Backend Models** (`tests/backend/models/`)

- User model validation and schema testing
- Service model validation and relationships
- Job model validation and workflow testing
- Database constraints and default values

**Backend Controllers** (`tests/backend/controllers/`)

- API endpoint functionality
- Authentication and authorization
- Error handling and validation
- Business logic testing

**Frontend Components** (`tests/frontend/components/`)

- Component rendering and props
- User interactions and events
- State management and context
- Accessibility and responsive design

### Integration Tests

**Full User Journeys** (`tests/integration/`)

- Customer registration → service discovery → booking flow
- Vendor registration → onboarding → service creation → job management
- Cross-component data flow and consistency
- Performance and scalability testing

## 🛠 Test Runner Options

```bash
# Basic usage
node run-tests.js [options]

# Options:
-h, --help         Show help message
-w, --watch        Run tests in watch mode
-c, --coverage     Generate test coverage report
-v, --verbose      Verbose output
-s, --silent       Minimal output
-u, --unit         Run only unit tests
--backend, --be    Run only backend tests
--frontend, --fe   Run only frontend tests
--integration, --int Run only integration tests
```

### Examples

```bash
# Run all tests with coverage
node run-tests.js --coverage

# Watch frontend tests during development
node run-tests.js --watch --frontend

# Run integration tests with verbose output
node run-tests.js --integration --verbose

# Silent mode for CI/CD
node run-tests.js --silent
```

## 📊 Coverage Reports

When running tests with the `--coverage` flag, detailed coverage reports are generated:

```bash
node run-tests.js --coverage
```

Reports are saved to:

- `coverage/lcov-report/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- Console output with coverage summary

## 🔧 Configuration

### Jest Configuration

The Jest configuration is defined in `tests/package.json`:

```json
{
  "jest": {
    "testEnvironment": "node",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
    "testMatch": ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
    "collectCoverageFrom": ["../backend/**/*.js", "../frontend/src/**/*.js"]
  }
}
```

### Test Environment Setup

The `setup.js` file provides:

- MongoDB in-memory server for isolated testing
- Firebase mocking for authentication
- Global test utilities and helpers
- Custom Jest matchers
- Database cleanup between tests

## 📝 Writing Tests

### Backend Model Tests

```javascript
const User = require("../../../backend/models/User");

describe("User Model", () => {
  test("should create user with valid data", async () => {
    const userData = testUtils.createMockUser();
    const user = await User.create(userData);

    expect(user._id).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
});
```

### Frontend Component Tests

```javascript
import { render, screen } from "@testing-library/react";
import Header from "../../../frontend/src/components/Header";

describe("Header Component", () => {
  test("should render navigation links", () => {
    render(<Header />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
  });
});
```

### Integration Tests

```javascript
const request = require("supertest");

describe("User Registration Flow", () => {
  test("should complete full registration process", async () => {
    const userData = testUtils.createMockUser();

    const response = await request(app)
      .post("/api/users")
      .send(userData)
      .expect(201);

    expect(response.body.email).toBe(userData.email);
  });
});
```

## 🔍 Test Utilities

The global `testUtils` object provides helper functions:

```javascript
// Create mock data
const user = testUtils.createMockUser();
const vendor = testUtils.createMockVendor();
const service = testUtils.createMockService(vendorId);
const job = testUtils.createMockJob(customerId, vendorId, serviceId);

// Mock Express objects
const req = testUtils.mockReq({ body: userData });
const res = testUtils.mockRes();
const next = testUtils.mockNext();
```

## 🎯 Best Practices

### Test Organization

- Group related tests in `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern

### Data Management

- Use test utilities for consistent mock data
- Clean up database state between tests
- Avoid hardcoded values, use configurable test data

### Error Testing

- Test both success and failure scenarios
- Verify error messages and status codes
- Test edge cases and boundary conditions

### Performance

- Run tests in parallel when possible
- Use beforeAll/afterAll for expensive setup/cleanup
- Mock external dependencies

## 🚨 Troubleshooting

### Common Issues

**Tests hanging or not completing:**

```bash
# Check for open handles
node run-tests.js --verbose --detectOpenHandles
```

**MongoDB connection issues:**

```bash
# Ensure MongoDB memory server is properly configured
# Check the setup.js file for connection settings
```

**Firebase authentication errors:**

```bash
# Verify Firebase mocks are properly configured
# Check that authentication middleware is mocked
```

**Coverage reports not generating:**

```bash
# Ensure coverage directory exists and is writable
node run-tests.js --coverage --verbose
```

### Debugging Tips

1. Use `--verbose` flag for detailed output
2. Run specific test files: `npx jest tests/backend/models/User.test.js`
3. Add `console.log` statements (they're mocked but visible in verbose mode)
4. Use Jest's debugging features: `--runInBand --no-cache`

## 🔄 Continuous Integration

For CI/CD pipelines, use:

```bash
# Install dependencies
cd tests && npm install

# Run tests with coverage and silent output
node run-tests.js --coverage --silent

# Optional: Upload coverage to external service
# npx codecov
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Supertest API Testing](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

## 🤝 Contributing

When adding new tests:

1. Follow the existing directory structure
2. Use the provided test utilities
3. Include both positive and negative test cases
4. Update this README if adding new test categories
5. Ensure all tests pass before submitting

---

For questions or issues with the test suite, please check the troubleshooting section or create an issue in the project repository.
