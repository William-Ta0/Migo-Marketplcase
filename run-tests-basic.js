#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running Basic Test Verification...\n');

// Run only basic infrastructure tests
const jestArgs = [
  '--config', path.join(__dirname, 'tests', 'package.json'),
  '--rootDir', path.join(__dirname, 'tests'),
  'basic.test.js',
  'database-connection.test.js',
  '--verbose',
  '--forceExit',
  '--detectOpenHandles',
  '--maxWorkers=1'
];

const cmd = 'npx jest';

console.log(`Running: ${cmd} ${jestArgs.join(' ')}\n`);

const testProcess = spawn(cmd, jestArgs, {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, 'tests'),
  env: {
    ...process.env,
    NODE_ENV: 'test',
    FORCE_COLOR: '1'
  }
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Basic tests passed! Test infrastructure is working.');
  } else {
    console.log(`\n❌ Tests failed with exit code ${code}`);
  }
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('Error running tests:', error);
  process.exit(1);
}); 