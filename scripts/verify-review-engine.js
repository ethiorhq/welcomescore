const assert = require("node:assert/strict");
const { generateDeterministicReview } = require("../.tmp-review-verification/lib/review/deterministic.js");

function context({ score, focusChecks = [], primaryLanguage = "TypeScript", goodFirstIssueCount = 0 }) {
  return {
    schemaVersion: 1,
    repo: "example/repository",
    score,
    grade: score >= 85 ? "A" : score >= 75 ? "B" : score >= 50 ? "C" : "F",
    primaryLanguage,
    hasReadme: true,
    hasLicense: true,
    goodFirstIssueCount,
    checks: [],
    focusChecks,
  };
}

const cases = [
  {
    name: "celebration band",
    input: context({ score: 92 }),
    expected: { mode: "celebration", spriteState: "jumping", focusChecks: [] },
  },
  {
    name: "strong guidance band",
    input: context({
      score: 75,
      focusChecks: [{ label: "Good-first-issue labels", points: 10, maxPoints: 25 }],
      goodFirstIssueCount: 4,
    }),
    expected: {
      mode: "motivation",
      spriteState: "review",
      focusChecks: ["Good-first-issue labels"],
    },
  },
  {
    name: "foundations guidance band",
    input: context({
      score: 60,
      focusChecks: [{ label: "README setup section", points: 0, maxPoints: 15 }],
    }),
    expected: {
      mode: "motivation",
      spriteState: "review",
      focusChecks: ["README setup section"],
    },
  },
  {
    name: "tough-love band",
    input: context({
      score: 45,
      focusChecks: [{ label: "LICENSE", points: 0, maxPoints: 10 }],
    }),
    expected: { mode: "tough-love", spriteState: "failed", focusChecks: ["LICENSE"] },
  },
];

for (const testCase of cases) {
  const review = generateDeterministicReview(testCase.input);
  assert.equal(review.schemaVersion, 1, `${testCase.name}: schema version`);
  assert.equal(review.provider, "rule-engine", `${testCase.name}: provider`);
  assert.equal(review.mode, testCase.expected.mode, `${testCase.name}: mode`);
  assert.equal(review.spriteState, testCase.expected.spriteState, `${testCase.name}: sprite`);
  assert.deepEqual(review.focusChecks, testCase.expected.focusChecks, `${testCase.name}: focus labels`);
  assert.ok(review.headline.length > 0 && review.headline.length <= 80, `${testCase.name}: headline bound`);
  assert.ok(review.roastText.length > 0 && review.roastText.length <= 220, `${testCase.name}: roast bound`);
  assert.ok(
    review.motivationText.length > 0 && review.motivationText.length <= 180,
    `${testCase.name}: motivation bound`,
  );
  assert.ok(
    review.focusChecks.every((label) => testCase.input.focusChecks.some((check) => check.label === label)),
    `${testCase.name}: labels derive from audit evidence`,
  );
}

console.log(`Verified ${cases.length} deterministic Algofox review cases.`);
