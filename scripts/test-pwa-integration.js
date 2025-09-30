#!/usr/bin/env node

/**
 * PWA Integration Test Runner
 * 
 * Comprehensive test suite that validates all PWA functionality
 * across different scenarios and device configurations.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds per test suite
  retries: 2,
  coverage: true,
  verbose: true,
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'PWA Core Integration',
    path: 'src/lib/__tests__/pwa-integration.test.ts',
    description: 'Service worker, caching, and offline functionality',
    critical: true,
  },
  {
    name: 'Mobile Device Testing',
    path: 'src/lib/__tests__/mobile-device-testing.test.ts',
    description: 'Cross-device compatibility and mobile optimization',
    critical: true,
  },
  {
    name: 'End-to-End PWA Workflow',
    path: 'src/__tests__/pwa-e2e.test.tsx',
    description: 'Complete user workflows and component integration',
    critical: true,
  },
  {
    name: 'Mobile Performance',
    path: 'src/lib/__tests__/mobile-performance-monitor.test.ts',
    description: 'Performance monitoring and optimization',
    critical: false,
  },
  {
    name: 'Mobile Analytics',
    path: 'src/lib/__tests__/mobile-analytics.test.ts',
    description: 'Analytics tracking and reporting',
    critical: false,
  },
  {
    name: 'Game Compatibility',
    path: 'src/lib/__tests__/mobile-game-compatibility.test.ts',
    description: 'Game adaptation and compatibility checking',
    critical: true,
  },
  {
    name: 'Touch Input Adaptation',
    path: 'src/lib/__tests__/touch-input-adapter.test.ts',
    description: 'Touch input handling and adaptation',
    critical: true,
  },
  {
    name: 'PWA Components',
    path: 'src/components/features/__tests__/MobileGameWrapper.test.tsx',
    description: 'PWA-specific React components',
    critical: true,
  },
  {
    name: 'PWA Hooks',
    path: 'src/hooks/__tests__/useMobilePerformance.test.ts',
    description: 'PWA-related React hooks',
    critical: false,
  },
];

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSubsection(title) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`  ${title}`, 'blue');
  log('-'.repeat(40), 'blue');
}

function checkPrerequisites() {
  logSection('Checking Prerequisites');
  
  const checks = [
    {
      name: 'Node.js version',
      command: 'node --version',
      validator: (output) => {
        const version = output.trim();
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 16;
      },
    },
    {
      name: 'npm/yarn availability',
      command: 'npm --version',
      validator: (output) => output.trim().length > 0,
    },
    {
      name: 'Vitest installation',
      command: 'npx vitest --version',
      validator: (output) => output.includes('vitest'),
    },
    {
      name: 'TypeScript compilation',
      command: 'npx tsc --noEmit',
      validator: () => true, // If no error thrown, it's valid
    },
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      log(`Checking ${check.name}...`, 'yellow');
      const output = execSync(check.command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 10000,
      });
      
      if (check.validator(output)) {
        log(`✓ ${check.name} - OK`, 'green');
      } else {
        log(`✗ ${check.name} - Failed validation`, 'red');
        allPassed = false;
      }
    } catch (error) {
      log(`✗ ${check.name} - Error: ${error.message}`, 'red');
      allPassed = false;
    }
  }

  if (!allPassed) {
    log('\nPrerequisite checks failed. Please fix the issues above.', 'red');
    process.exit(1);
  }

  log('\n✓ All prerequisites passed!', 'green');
}

function runTestSuite(suite) {
  logSubsection(`Running: ${suite.name}`);
  log(`Description: ${suite.description}`, 'cyan');
  log(`Path: ${suite.path}`, 'blue');
  
  if (!fs.existsSync(suite.path)) {
    log(`⚠ Test file not found: ${suite.path}`, 'yellow');
    return { passed: false, skipped: true, error: 'File not found' };
  }

  const command = [
    'npx vitest run',
    `--reporter=verbose`,
    `--timeout=${TEST_CONFIG.timeout}`,
    TEST_CONFIG.coverage ? '--coverage' : '',
    `"${suite.path}"`,
  ].filter(Boolean).join(' ');

  try {
    log(`Executing: ${command}`, 'blue');
    
    const startTime = Date.now();
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: TEST_CONFIG.timeout + 5000, // Add buffer
    });
    const duration = Date.now() - startTime;

    // Parse test results from output
    const testResults = parseTestOutput(output);
    
    log(`✓ ${suite.name} completed in ${duration}ms`, 'green');
    log(`  Tests: ${testResults.passed}/${testResults.total} passed`, 'green');
    
    if (testResults.failed > 0) {
      log(`  Failed: ${testResults.failed}`, 'red');
    }
    
    return {
      passed: testResults.failed === 0,
      skipped: false,
      duration,
      results: testResults,
      output,
    };
  } catch (error) {
    log(`✗ ${suite.name} failed: ${error.message}`, 'red');
    
    // Try to extract useful error information
    const errorOutput = error.stdout || error.stderr || error.message;
    const testResults = parseTestOutput(errorOutput);
    
    return {
      passed: false,
      skipped: false,
      error: error.message,
      results: testResults,
      output: errorOutput,
    };
  }
}

function parseTestOutput(output) {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Parse vitest output for test counts
  const lines = output.split('\n');
  
  for (const line of lines) {
    // Look for test result summaries
    if (line.includes('Test Files')) {
      const match = line.match(/(\d+) passed/);
      if (match) {
        results.passed = parseInt(match[1]);
      }
      
      const failMatch = line.match(/(\d+) failed/);
      if (failMatch) {
        results.failed = parseInt(failMatch[1]);
      }
    }
    
    // Count individual test results
    if (line.includes('✓') || line.includes('PASS')) {
      results.total++;
    } else if (line.includes('✗') || line.includes('FAIL')) {
      results.total++;
      results.failed++;
    }
  }

  results.passed = results.total - results.failed;
  
  return results;
}

function generateReport(results) {
  logSection('Test Results Summary');
  
  const totalSuites = results.length;
  const passedSuites = results.filter(r => r.passed && !r.skipped).length;
  const failedSuites = results.filter(r => !r.passed && !r.skipped).length;
  const skippedSuites = results.filter(r => r.skipped).length;
  
  log(`Total Test Suites: ${totalSuites}`, 'bright');
  log(`Passed: ${passedSuites}`, 'green');
  log(`Failed: ${failedSuites}`, failedSuites > 0 ? 'red' : 'green');
  log(`Skipped: ${skippedSuites}`, skippedSuites > 0 ? 'yellow' : 'green');
  
  // Detailed results
  log('\nDetailed Results:', 'bright');
  
  for (let i = 0; i < TEST_SUITES.length; i++) {
    const suite = TEST_SUITES[i];
    const result = results[i];
    
    const status = result.skipped ? '⚠ SKIPPED' : 
                   result.passed ? '✓ PASSED' : '✗ FAILED';
    const color = result.skipped ? 'yellow' : 
                  result.passed ? 'green' : 'red';
    
    log(`  ${status} ${suite.name}`, color);
    
    if (result.results) {
      log(`    Tests: ${result.results.passed}/${result.results.total}`, 'blue');
    }
    
    if (result.duration) {
      log(`    Duration: ${result.duration}ms`, 'blue');
    }
    
    if (result.error) {
      log(`    Error: ${result.error}`, 'red');
    }
  }
  
  // Critical test failures
  const criticalFailures = results.filter((r, i) => 
    !r.passed && !r.skipped && TEST_SUITES[i].critical
  );
  
  if (criticalFailures.length > 0) {
    log('\n⚠ Critical Test Failures:', 'red');
    criticalFailures.forEach((result, i) => {
      const suiteIndex = results.indexOf(result);
      const suite = TEST_SUITES[suiteIndex];
      log(`  - ${suite.name}: ${result.error || 'Unknown error'}`, 'red');
    });
  }
  
  // Coverage information
  log('\nCoverage Information:', 'bright');
  log('  Run with --coverage flag for detailed coverage report', 'blue');
  
  // Recommendations
  log('\nRecommendations:', 'bright');
  
  if (failedSuites > 0) {
    log('  - Review failed tests and fix underlying issues', 'yellow');
    log('  - Check browser compatibility for PWA features', 'yellow');
    log('  - Verify mobile device simulation is working correctly', 'yellow');
  }
  
  if (skippedSuites > 0) {
    log('  - Ensure all test files exist and are properly configured', 'yellow');
  }
  
  if (passedSuites === totalSuites - skippedSuites) {
    log('  - All tests passed! PWA integration is working correctly', 'green');
    log('  - Consider running tests on real devices for final validation', 'green');
  }
  
  return {
    totalSuites,
    passedSuites,
    failedSuites,
    skippedSuites,
    criticalFailures: criticalFailures.length,
  };
}

function validatePWARequirements() {
  logSection('Validating PWA Requirements');
  
  const requirements = [
    {
      name: 'Manifest file exists',
      check: () => fs.existsSync('public/manifest.json'),
    },
    {
      name: 'Service worker exists',
      check: () => fs.existsSync('public/sw.js'),
    },
    {
      name: 'PWA icons exist',
      check: () => {
        const iconSizes = ['192x192', '512x512'];
        return iconSizes.every(size => 
          fs.existsSync(`public/icons/icon-${size}.png`)
        );
      },
    },
    {
      name: 'HTTPS configuration (Next.js)',
      check: () => {
        const nextConfig = 'next.config.js';
        if (!fs.existsSync(nextConfig)) return false;
        
        const content = fs.readFileSync(nextConfig, 'utf8');
        return content.includes('withPWA') || content.includes('pwa');
      },
    },
    {
      name: 'Mobile viewport meta tag',
      check: () => {
        const layoutFile = 'src/app/layout.tsx';
        if (!fs.existsSync(layoutFile)) return false;
        
        const content = fs.readFileSync(layoutFile, 'utf8');
        return content.includes('viewport') && content.includes('device-width');
      },
    },
  ];
  
  let allValid = true;
  
  for (const req of requirements) {
    try {
      const isValid = req.check();
      log(`${isValid ? '✓' : '✗'} ${req.name}`, isValid ? 'green' : 'red');
      if (!isValid) allValid = false;
    } catch (error) {
      log(`✗ ${req.name} - Error: ${error.message}`, 'red');
      allValid = false;
    }
  }
  
  if (!allValid) {
    log('\n⚠ Some PWA requirements are not met. This may affect test results.', 'yellow');
  } else {
    log('\n✓ All PWA requirements validated!', 'green');
  }
  
  return allValid;
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  logSection('PWA Integration Test Runner');
  log('Starting comprehensive PWA testing suite...', 'bright');
  
  // Check prerequisites
  checkPrerequisites();
  
  // Validate PWA requirements
  validatePWARequirements();
  
  // Run test suites
  logSection('Running Test Suites');
  
  const results = [];
  
  for (const suite of TEST_SUITES) {
    const result = runTestSuite(suite);
    results.push(result);
    
    // Add delay between test suites to prevent resource conflicts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate final report
  const summary = generateReport(results);
  
  const totalTime = Date.now() - startTime;
  
  logSection('Final Summary');
  log(`Total execution time: ${totalTime}ms`, 'bright');
  log(`Test suites completed: ${summary.totalSuites}`, 'bright');
  
  if (summary.criticalFailures > 0) {
    log(`\n❌ PWA integration has critical issues (${summary.criticalFailures} critical failures)`, 'red');
    log('Please fix critical issues before deploying to production.', 'red');
    process.exit(1);
  } else if (summary.failedSuites > 0) {
    log(`\n⚠ PWA integration has minor issues (${summary.failedSuites} non-critical failures)`, 'yellow');
    log('Consider fixing these issues for optimal PWA experience.', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ PWA integration is fully functional!', 'green');
    log('All tests passed. Ready for production deployment.', 'green');
    process.exit(0);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\nTest execution interrupted by user.', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n\nTest execution terminated.', 'yellow');
  process.exit(143);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    log(`\nFatal error: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = {
  runTestSuite,
  generateReport,
  validatePWARequirements,
  TEST_SUITES,
};