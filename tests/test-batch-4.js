/**
 * Batch 4 Unit & Verification Tests
 * Zero-Green & Oceanic Blue Enforcement (BUG-12)
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- RUNNING BATCH 4 ZERO-GREEN VERIFICATION TESTS ---');

function testZeroGreenInPortals() {
  const dirs = [
    path.join(__dirname, '../frontend/portal/admin'),
    path.join(__dirname, '../frontend/portal/siswa')
  ];

  const greenClassRegex = /(emerald|green|teal)-[a-z0-9]+/g;
  const greenHexes = ['#059669', '#047857', '#d1fae5', '#10b981', '#ecfdf5', '#a7f3d0', '#065f46'];

  let totalViolations = 0;
  const violationDetails = [];

  dirs.forEach(dir => {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check classes
      const matches = content.match(greenClassRegex);
      if (matches) {
        totalViolations += matches.length;
        violationDetails.push(`${file}: found green classes -> ${[...new Set(matches)].join(', ')}`);
      }

      // Check hexes
      greenHexes.forEach(h => {
        if (content.toLowerCase().includes(h.toLowerCase())) {
          totalViolations++;
          violationDetails.push(`${file}: found green hex -> ${h}`);
        }
      });
    });
  });

  if (totalViolations > 0) {
    console.error('Zero-Green violations found:\n' + violationDetails.join('\n'));
  }

  assert.strictEqual(
    totalViolations,
    0,
    `Portal HTML contains ${totalViolations} green/emerald/teal violations! Zero-Green rule strictly required.`
  );

  console.log('✓ Test 1: Zero-Green rule passed. All portal HTML strictly conforms to Oceanic Blue.');
}

try {
  testZeroGreenInPortals();
  console.log('\nALL BATCH 4 TESTS PASSED!');
} catch (err) {
  console.error('\nTEST FAILED:', err.message);
  process.exit(1);
}
