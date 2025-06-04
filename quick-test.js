#!/usr/bin/env node

/**
 * Quick Test Runner - Tests without slow database operations
 * This runs only fast tests to verify the code structure
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Running Quick Tests (No Database Operations)...\n');

const testCommand = path.join(__dirname, 'tests', 'node_modules', '.bin', 'jest');
const args = [
  'basic.test.js',
  '--testPathPattern=basic',
  '--testTimeout=5000',
  '--forceExit',
  '--detectOpenHandles',
  '--verbose'
];

const testProcess = spawn(testCommand, args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, 'tests')
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Quick tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✓ Test infrastructure working');
    console.log('   ✓ Mock utilities available'); 
    console.log('   ✓ Jest configuration correct');
    console.log('   ✓ Environment setup complete');
    console.log('\n💡 To run full tests with database: npm test');
  } else {
    console.log('\n❌ Some quick tests failed');
    process.exit(1);
  }
});

testProcess.on('error', (error) => {
  console.error('❌ Error running tests:', error.message);
  process.exit(1);
}); 