# 🧪 Testing Guide - Migo Marketplace

This document provides comprehensive information about testing the Migo Marketplace application, including setup, execution, and best practices.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Test Architecture](#test-architecture)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Coverage Reports](#coverage-reports)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### 1. Setup Test Environment

```bash
# Quick setup with the provided script
./setup-tests.sh

# Manual setup
cd tests
npm install
cd ..
```

### 2. Run Tests

```bash
# Run all tests
node run-tests.js

# Run with coverage
node run-tests.js --coverage

# Run specific categories
node run-tests.js --backend
node run-tests.js --frontend
node run-tests.js --integration
```

## 🏗 Test Architecture

Our testing framework is built with:

- **Jest** - Test runner and assertion library
- **Testing Library** - React component testing utilities
- **Supertest** - HTTP assertion library for API testing
- **MongoDB Memory Server** - In-memory database for isolated testing
- **Custom Test Runner** - Unified command-line interface

### Directory Structure

```
tests/
├── setup.js                    # Global configuration
├── package.json                # Test dependencies
├── backend/
│   ├── models/                 # Model unit tests
│   ├── controllers/            # Controller unit tests
│   ├── routes/                 # Route tests
│   └── middleware/             # Middleware tests
├── frontend/
│   ├── components/             # Component tests
│   └── pages/                  # Page tests
└── integration/                # End-to-end tests
```

## 🎯 Test Categories

### Unit Tests

**Backend Models** - Database schema and validation testing

- User model validation
- Service model relationships
- Job workflow testing
- Data integrity checks

**Backend Controllers** - API endpoint functionality

- Authentication and authorization
- CRUD operations
- Error handling
- Business logic validation

**Frontend Components** - UI component testing

- Rendering and props
- User interactions
- State management
- Accessibility compliance

### Integration Tests

**Full User Journeys** - End-to-end workflow testing

- Customer registration and booking flow
- Vendor onboarding and service management
- Cross-component data consistency
- Performance and scalability

## 🏃‍♂️ Running Tests

### Basic Commands

```bash
# All tests
node run-tests.js

# Specific categories
node run-tests.js --backend      # Backend only
node run-tests.js --frontend     # Frontend only
node run-tests.js --integration  # Integration only
node run-tests.js --unit         # Unit tests only

# With options
node run-tests.js --coverage     # Generate coverage report
node run-tests.js --watch        # Watch mode for development
node run-tests.js --verbose      # Detailed output
node run-tests.js --silent       # Minimal output for CI
```

### Development Workflow

```bash
# Watch frontend tests during development
node run-tests.js --watch --frontend

# Run specific test file
npx jest tests/backend/models/User.test.js

# Debug failing tests
node run-tests.js --verbose --backend
```

## 📊 Coverage Reports

Coverage reports provide insights into test completeness:

```bash
# Generate coverage report
node run-tests.js --coverage
```

**Report Locations:**

- `coverage/lcov-report/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- Console output - Summary statistics

**Coverage Targets:**

- **Models**: 90%+ coverage
- **Controllers**: 85%+ coverage
- **Components**: 80%+ coverage
- **Overall**: 85%+ coverage

## ✍️ Writing Tests

### Backend Model Example

```javascript
const User = require("../../../backend/models/User");

describe("User Model", () => {
  afterEach(async () => {
    await User.deleteMany({});
  });

  test("should create user with valid data", async () => {
    const userData = testUtils.createMockUser();
    const user = await User.create(userData);

    expect(user._id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.role).toBe("customer");
  });

  test("should validate required fields", async () => {
    const user = new User({});

    await expect(user.save()).rejects.toThrow();
  });
});
```

### Backend Controller Example

```javascript
const userController = require("../../../backend/controllers/userController");
const User = require("../../../backend/models/User");

describe("User Controller", () => {
  test("should register new user", async () => {
    const userData = testUtils.createMockUser();
    const req = testUtils.mockReq({
      body: userData,
      user: { uid: userData.firebaseUid },
    });
    const res = testUtils.mockRes();

    await userController.registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        email: userData.email,
      })
    );
  });
});
```

### Frontend Component Example

```javascript
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Header from "../../../frontend/src/components/Header";

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("Header Component", () => {
  test("should render navigation links", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
  });

  test("should handle search submission", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "web development" } });
    fireEvent.submit(searchInput.closest("form"));

    // Verify navigation or API call
  });
});
```

### Integration Test Example

```javascript
const request = require("supertest");
const User = require("../../backend/models/User");
const Service = require("../../backend/models/Service");

describe("User-Service Integration", () => {
  test("complete customer journey", async () => {
    // 1. Register vendor
    const vendorData = testUtils.createMockVendor();
    const vendorResponse = await request(app)
      .post("/api/users")
      .send(vendorData)
      .expect(201);

    // 2. Create service
    const serviceData = testUtils.createMockService(vendorResponse.body._id);
    const serviceResponse = await request(app)
      .post("/api/services")
      .send(serviceData)
      .expect(201);

    // 3. Register customer
    const customerData = testUtils.createMockUser({ role: "customer" });
    const customerResponse = await request(app)
      .post("/api/users")
      .send(customerData)
      .expect(201);

    // 4. Book service
    const jobData = testUtils.createMockJob(
      customerResponse.body._id,
      vendorResponse.body._id,
      serviceResponse.body._id
    );

    await request(app).post("/api/jobs").send(jobData).expect(201);
  });
});
```

## 🔧 Test Utilities

### Available Utilities

```javascript
// Mock data creation
const user = testUtils.createMockUser({
  role: "customer",
  email: "custom@example.com",
});

const vendor = testUtils.createMockVendor({
  vendorInfo: {
    onboardingCompleted: true,
    rating: { average: 4.8, count: 25 },
  },
});

const service = testUtils.createMockService(vendorId, {
  title: "Custom Service",
  pricing: { type: "hourly", amount: 50 },
});

const job = testUtils.createMockJob(customerId, vendorId, serviceId, {
  status: "completed",
});

// Express mocks
const req = testUtils.mockReq({
  body: { name: "Test" },
  params: { id: "123" },
  user: { uid: "firebase-uid" },
});

const res = testUtils.mockRes();
const next = testUtils.mockNext();
```

### Custom Matchers

```javascript
// Custom Jest matchers
expect(objectId).toBeValidObjectId();
expect(response.body).toMatchSchema(userSchema);
expect(component).toBeAccessible();
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd tests
          npm install

      - name: Run tests
        run: node run-tests.js --coverage --silent

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "node run-tests.js --unit --silent"
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

**Tests Hanging:**

```bash
# Check for open handles
node run-tests.js --detectOpenHandles --forceExit
```

**MongoDB Issues:**

```bash
# Clear MongoDB connections
killall mongod
node run-tests.js --backend
```

**Coverage Not Generating:**

```bash
# Ensure proper permissions
chmod -R 755 coverage/
node run-tests.js --coverage --verbose
```

**Firebase Authentication Errors:**

```bash
# Verify mocks are properly configured
grep -r "firebase-admin" tests/setup.js
```

### Debugging Tips

1. **Use Verbose Mode**: `node run-tests.js --verbose`
2. **Run Single Test**: `npx jest tests/specific/test.js`
3. **Check Setup**: Verify `tests/setup.js` configuration
4. **Database State**: Ensure proper cleanup between tests
5. **Mock Verification**: Check that all external dependencies are mocked

### Performance Optimization

```bash
# Run tests in parallel
node run-tests.js --maxWorkers=4

# Run specific test suites
node run-tests.js --backend --testNamePattern="User"

# Skip slow integration tests during development
node run-tests.js --unit
```

## 📈 Best Practices

### Test Organization

- Use descriptive test names
- Group related tests in `describe` blocks
- Follow Arrange-Act-Assert pattern
- Keep tests focused and independent

### Data Management

- Use test utilities for consistent mock data
- Clean up database state between tests
- Avoid hardcoded test data
- Use factories for complex objects

### Mocking Strategy

- Mock external dependencies
- Use real database for integration tests
- Mock Firebase authentication
- Isolate units under test

### Coverage Goals

- Aim for high coverage but focus on quality
- Test edge cases and error conditions
- Cover critical business logic paths
- Include accessibility and performance tests

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Docs](https://testing-library.com/)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

---

For more detailed information, see the `tests/README.md` file or contact the development team.
