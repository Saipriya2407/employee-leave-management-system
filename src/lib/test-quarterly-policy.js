import {
  getQuarterFromDate,
  getQuarterDateBoundaries,
  splitRequestByQuarters,
  calculateAvailableBalance,
} from "./quarterly-policy.js";

function runQuarterlyPolicyTests() {
  console.log("================================================================================");
  console.log("QUARTERLY POLICY & ALLOCATION ENGINE - TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assertTest(condition, name) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] Test ${total}: ${name}`);
    } else {
      console.error(`  [FAIL] Test ${total}: ${name}`);
    }
  }

  // 1. Quarter calculation tests
  console.log("--- 1. Quarter Calculation Tests ---");
  assertTest(getQuarterFromDate("2026-01-15").quarter === 1, "Jan 15 is in Q1");
  assertTest(getQuarterFromDate("2026-03-31").quarter === 1, "Mar 31 is in Q1");
  assertTest(getQuarterFromDate("2026-04-01").quarter === 2, "Apr 01 is in Q2");
  assertTest(getQuarterFromDate("2026-07-10").quarter === 3, "Jul 10 is in Q3");
  assertTest(getQuarterFromDate("2026-11-05").quarter === 4, "Nov 05 is in Q4");
  assertTest(getQuarterFromDate("2026-12-31").quarter === 4, "Dec 31 is in Q4");

  // 2. Quarter boundaries
  console.log("\n--- 2. Quarter Boundaries ---");
  const q1Bounds = getQuarterDateBoundaries(2026, 1);
  assertTest(q1Bounds.start.getMonth() === 0 && q1Bounds.start.getDate() === 1, "Q1 starts Jan 1");
  assertTest(q1Bounds.end.getMonth() === 2 && q1Bounds.end.getDate() === 31, "Q1 ends Mar 31");

  const q4Bounds = getQuarterDateBoundaries(2026, 4);
  assertTest(q4Bounds.start.getMonth() === 9 && q4Bounds.start.getDate() === 1, "Q4 starts Oct 1");
  assertTest(q4Bounds.end.getMonth() === 11 && q4Bounds.end.getDate() === 31, "Q4 ends Dec 31");

  // 3. Cross-quarter request splitting
  console.log("\n--- 3. Cross-Quarter Request Splitting ---");
  // Single-quarter range: March 10 to March 12 (3 days)
  const singleQ = splitRequestByQuarters("2026-03-10", "2026-03-12");
  assertTest(singleQ.length === 1 && singleQ[0].quarter === 1 && singleQ[0].allocatedDays === 3, "Single quarter request (3 days in Q1)");

  // Cross-quarter range: March 30 to April 2 (March 30, 31 = 2 days in Q1; April 1, 2 = 2 days in Q2)
  const crossQ = splitRequestByQuarters("2026-03-30", "2026-04-02");
  assertTest(crossQ.length === 2, "Cross-quarter request split into 2 quarter segments");
  assertTest(crossQ[0].quarter === 1 && crossQ[0].allocatedDays === 2, "Segment 1: 2 days in Q1");
  assertTest(crossQ[1].quarter === 2 && crossQ[1].allocatedDays === 2, "Segment 2: 2 days in Q2");

  // 4. Balance Calculations
  console.log("\n--- 4. Balance Formula Calculations ---");
  const sampleQ1 = {
    casualAllocated: 3,
    casualUsed: 1,
    casualReserved: 1,
    sickAllocated: 3,
    sickCarryIn: 0,
    sickUsed: 0,
    sickReserved: 1,
    wfhAllocated: 3,
    wfhUsed: 2,
    wfhReserved: 0,
  };

  const casualBal = calculateAvailableBalance(sampleQ1, "CASUAL");
  assertTest(casualBal.available === 1, "Casual balance = 3 allocated - 1 used - 1 reserved = 1 available");

  const wfhBal = calculateAvailableBalance(sampleQ1, "WFH");
  assertTest(wfhBal.available === 1, "WFH balance = 3 allocated - 2 used - 0 reserved = 1 available");

  const sickBalQ1 = calculateAvailableBalance(sampleQ1, "SICK");
  assertTest(sickBalQ1.available === 2, "Sick balance Q1 = (3 + 0 carryIn) - 0 used - 1 reserved = 2 available");

  // Sample Q2 with carry-in from Q1
  const sampleQ2 = {
    casualAllocated: 3,
    casualUsed: 0,
    casualReserved: 0,
    sickAllocated: 3,
    sickCarryIn: 2, // 2 days carried forward from Q1!
    sickUsed: 1,
    sickReserved: 0,
    wfhAllocated: 3,
    wfhUsed: 0,
    wfhReserved: 0,
  };

  const sickBalQ2 = calculateAvailableBalance(sampleQ2, "SICK");
  assertTest(sickBalQ2.available === 4, "Sick balance Q2 = (3 allocated + 2 carryIn) - 1 used - 0 reserved = 4 available");

  console.log("\n================================================================================");
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log("================================================================================");
}

runQuarterlyPolicyTests();

