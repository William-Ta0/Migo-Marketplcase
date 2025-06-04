#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Configuration
const config = {
  testDir: './tests',
  coverageDir: './coverage',
  reportsDir: './test-reports',
  timeout: 30000,
  setupTimeout: 10000
};

// Progress tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function showHeader() {
  console.log(colorize('cyan', '=== Migo Marketplace Test Runner ==='));
  console.log('');
}

function showProgress() {
  const total = passedTests + failedTests + skippedTests;
  const progressBar = '█'.repeat(Math.floor((total / Math.max(totalTests, 1)) * 20));
  const emptyBar = '░'.repeat(20 - progressBar.length);
  
  process.stdout.write(`\r${colorize('cyan', '📊 Progress:')} [${progressBar}${emptyBar}] ${total}/${totalTests} | `);
  process.stdout.write(`${colorize('green', '✅ ' + passedTests)} `);
  process.stdout.write(`${colorize('red', '❌ ' + failedTests)} `);
  process.stdout.write(`${colorize('yellow', '⏭️  ' + skippedTests)}`);
}

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  watch: args.includes('--watch') || args.includes('-w'),
  coverage: args.includes('--coverage') || args.includes('-c'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  silent: args.includes('--silent') || args.includes('-s'),
  backend: args.includes('--backend') || args.includes('--be'),
  frontend: args.includes('--frontend') || args.includes('--fe'),
  integration: args.includes('--integration') || args.includes('--int'),
  unit: args.includes('--unit') || args.includes('-u'),
  help: args.includes('--help') || args.includes('-h')
};

// Help text
const helpText = `
${colors.cyan}Migo Marketplace Test Runner${colors.reset}

${colors.bright}Usage:${colors.reset}
  node run-tests.js [options]

${colors.bright}Options:${colors.reset}
  -h, --help         Show this help message
  -w, --watch        Run tests in watch mode
  -c, --coverage     Generate test coverage report
  -v, --verbose      Verbose output
  -s, --silent       Minimal output
  -u, --unit         Run only unit tests
  --backend, --be    Run only backend tests
  --frontend, --fe   Run only frontend tests
  --integration, --int Run only integration tests

${colors.bright}Examples:${colors.reset}
  node run-tests.js                    # Run all tests
  node run-tests.js --backend          # Run only backend tests
  node run-tests.js --coverage         # Run all tests with coverage
  node run-tests.js --watch --frontend # Watch frontend tests
  node run-tests.js --unit --verbose   # Run unit tests with verbose output

${colors.bright}Test Organization:${colors.reset}
  tests/backend/models/         - Model unit tests
  tests/backend/controllers/    - Controller unit tests
  tests/backend/routes/        - Route unit tests
  tests/frontend/components/   - Component unit tests
  tests/frontend/pages/        - Page unit tests
  tests/integration/          - Integration tests
`;

// Show help if requested
if (options.help) {
  console.log(helpText);
  process.exit(0);
}

// Utility functions
function log(message, color = 'white') {
  if (!options.silent) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

function logSection(title) {
  if (!options.silent) {
    console.log(`\n${colors.cyan}${colors.bright}=== ${title} ===${colors.reset}\n`);
  }
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if required directories exist
function checkEnvironment() {
  const requiredDirs = [config.testDir];
  const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));
  
  if (missingDirs.length > 0) {
    logError(`Missing required directories: ${missingDirs.join(', ')}`);
    logInfo('Run the following commands to create missing directories:');
    missingDirs.forEach(dir => {
      log(`  mkdir -p ${dir}`, 'cyan');
    });
    process.exit(1);
  }
}

// Create output directories
function createOutputDirs() {
  [config.coverageDir, config.reportsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Build Jest command
function buildJestCommand() {
  const jestBin = path.join(__dirname, 'tests', 'node_modules', '.bin', 'jest');
  const cmd = fs.existsSync(jestBin) ? jestBin : 'npx jest';
  
  const jestArgs = [
    '--config', path.join(__dirname, 'tests', 'package.json'),
    '--rootDir', path.join(__dirname, 'tests')
  ];

  // Test pattern selection
  if (options.backend && !options.frontend && !options.integration) {
    jestArgs.push('backend');
  } else if (options.frontend && !options.backend && !options.integration) {
    jestArgs.push('frontend');
  } else if (options.integration && !options.backend && !options.frontend) {
    jestArgs.push('integration');
  } else if (options.unit) {
    jestArgs.push('backend', 'frontend');
  }

  // Coverage
  if (options.coverage) {
    jestArgs.push('--coverage');
    jestArgs.push('--coverageDirectory', path.join(__dirname, config.coverageDir));
  }

  // Watch mode
  if (options.watch) {
    jestArgs.push('--watch');
  }

  // Verbose output
  if (options.verbose) {
    jestArgs.push('--verbose');
  }

  // Silent mode
  if (options.silent) {
    jestArgs.push('--silent');
  }

  // Additional Jest options
  jestArgs.push('--detectOpenHandles');
  jestArgs.push('--forceExit');
  jestArgs.push('--maxWorkers', '50%');

  return { cmd, args: jestArgs };
}

// Run Jest tests
function runTests() {
  return new Promise((resolve, reject) => {
    const { cmd, args } = buildJestCommand();
    
    // Add retry logic for flaky MongoDB tests
    const maxRetries = 2;
    let retryCount = 0;
    
    function attemptTest() {
      logInfo(`Running command: ${cmd} ${args.join(' ')}${retryCount > 0 ? ` (Retry ${retryCount}/${maxRetries})` : ''}`);
      
      const testProcess = spawn(cmd, args, {
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: true,
        cwd: path.join(__dirname, 'tests'),
        env: {
          ...process.env,
          NODE_ENV: 'test',
          FORCE_COLOR: '1'
        }
      });

      let testOutput = '';
      
      if (options.silent) {
        testProcess.stdout?.on('data', (data) => {
          testOutput += data.toString();
        });
        testProcess.stderr?.on('data', (data) => {
          testOutput += data.toString();
        });
      }

      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          // Check if this is a MongoDB-related failure that might benefit from retry
          const isMongoError = testOutput.includes('spawn Unknown system error -88') || 
                              testOutput.includes('MongoMemoryServer') ||
                              testOutput.includes('Failed to start within');
          
          if (isMongoError && retryCount < maxRetries) {
            retryCount++;
            logWarning(`MongoDB connection issue detected. Retrying... (${retryCount}/${maxRetries})`);
            setTimeout(attemptTest, 3000); // Wait 3 seconds before retry
          } else {
            if (options.silent && testOutput) {
              console.log(testOutput);
            }
            reject(new Error(`Tests failed with exit code ${code}`));
          }
        }
      });

      testProcess.on('error', (error) => {
        if (retryCount < maxRetries && error.message.includes('spawn')) {
          retryCount++;
          logWarning(`Process spawn error. Retrying... (${retryCount}/${maxRetries})`);
          setTimeout(attemptTest, 2000);
        } else {
          reject(error);
        }
      });
    }
    
    attemptTest();
  });
}

// Generate test report
function generateReport() {
  if (!options.coverage) return;

  logSection('Test Coverage Report');
  
  const coverageFile = path.join(config.coverageDir, 'lcov-report', 'index.html');
  
  if (fs.existsSync(coverageFile)) {
    logSuccess(`Coverage report generated: ${coverageFile}`);
    logInfo('Open the following file in your browser to view the coverage report:');
    log(`  file://${path.resolve(coverageFile)}`, 'cyan');
  } else {
    logWarning('Coverage report not found');
  }
}

// Display test summary
function displaySummary(startTime) {
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  logSection('Test Summary');
  logInfo(`Test execution completed in ${duration} seconds`);
  
  if (options.coverage) {
    logInfo('Coverage report generated');
  }
  
  if (options.watch) {
    logInfo('Tests running in watch mode - Press Ctrl+C to exit');
  }
}

// Check dependencies
function checkDependencies() {
  const packageJsonPath = path.join(__dirname, 'tests', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    logError('Test package.json not found');
    logInfo('Run the following commands to set up the test environment:');
    log('  cd tests', 'cyan');
    log('  npm install', 'cyan');
    process.exit(1);
  }
  
  const nodeModulesPath = path.join(__dirname, 'tests', 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    logWarning('Test dependencies not installed');
    logInfo('Installing test dependencies...');
    
    return new Promise((resolve, reject) => {
      const npmProcess = spawn('npm', ['install'], {
        stdio: 'inherit',
        shell: true,
        cwd: path.join(__dirname, 'tests')
      });
      
      npmProcess.on('close', (code) => {
        if (code === 0) {
          logSuccess('Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`npm install failed with exit code ${code}`));
        }
      });
      
      npmProcess.on('error', reject);
    });
  }
  
  return Promise.resolve();
}

// Main execution function
async function main() {
  const startTime = Date.now();
  
  try {
    logSection('Migo Marketplace Test Runner');
    
    // Environment checks
    checkEnvironment();
    createOutputDirs();
    
    // Install dependencies if needed
    await checkDependencies();
    
    // Run tests
    logSection('Running Tests');
    await runTests();
    
    // Generate reports
    generateReport();
    
    // Display summary
    displaySummary(startTime);
    
    logSuccess('All tests completed successfully!');
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    
    if (options.verbose) {
      console.error(error);
    }
    
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\nTest execution interrupted by user', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\nTest execution terminated', 'yellow');
  process.exit(0);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError('Uncaught Exception:', error.message);
  if (options.verbose) {
    console.error(error);
  }
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  main,
  runTests,
  buildJestCommand,
  checkEnvironment,
  createOutputDirs
}; 