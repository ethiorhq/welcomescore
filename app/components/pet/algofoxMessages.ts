import { selectNonRepeatingVariant, type VariantHistory } from "@/lib/variation";

const messages = {
  idle: [
    "Algofox is ready to inspect your contributor path.",
    "Need a contributor-path check? Algofox is on standby.",
    "Algofox is here when you are ready to inspect a repository.",
    "A clearer first contribution starts with one quick audit.",
  ],
  waiting: [
    "Quiet moment detected. I’ll be here when you are ready.",
    "No rush. Algofox is keeping the contributor path warm.",
    "Taking a pause? Your next repository check can wait here.",
    "Whenever you are ready, Algofox can inspect the welcome path.",
  ],
  travel: [
    "Nice route. Algofox is happy to explore your developer workspace.",
    "New perch secured. This workspace has excellent fox routing.",
    "Travel complete. Algofox has a better view of the contributor path now.",
    "Position updated. A good workspace layout deserves a quick sprint.",
  ],
  prompt: [
    "Still here. Let’s make a repository easier to join.",
    "Ready when you are. Small contributor signals make a large difference.",
    "Point me at a repo and I’ll inspect the first-contributor path.",
    "Let’s turn a public repository into a clearer invitation to contribute.",
  ],
  auditRunning: [
    "Scanning contributor signals: docs, setup, license, and newcomer issues.",
    "Checking the practical welcome signals a first contributor needs.",
    "Following the path from repository landing page to a first pull request.",
  ],
  auditMissing: [
    "I couldn’t finish that audit. Check the repository link and try again.",
    "That repository did not resolve cleanly. A quick spelling check should help.",
    "Algofox could not reach that contributor path. Try the owner/repo link again.",
  ],
  auditCelebration: [
    "Strong contributor path. Algofox is celebrating!",
    "This repository makes a first contribution feel genuinely approachable.",
    "The practical welcome signals are in place. Nicely maintained path.",
  ],
  auditStrong: [
    "Solid foundation. Let’s review the final contributor details.",
    "The contributor path is taking shape. A few details can make it even clearer.",
    "This is a promising welcome signal. Let’s look at the remaining opportunities.",
  ],
  auditImprove: [
    "There is a clear path upward. Let’s improve one contributor signal at a time.",
    "Every contributor path starts somewhere. One practical improvement can move this forward.",
    "Algofox found useful next steps. Start with the most visible newcomer gap.",
  ],
  auditUnavailable: [
    "I couldn’t reach that audit right now. Let’s try again in a moment.",
    "That check is taking a breather. Please try the repository again shortly.",
    "The audit service did not answer this time. A fresh attempt should be quick.",
  ],
  auditFocus: [
    "Drop a GitHub repository here and I’ll inspect the first-contributor path.",
    "Enter an owner/repo path and Algofox will check the practical welcome signals.",
    "Ready for a repository link. We’ll follow the route a new contributor sees.",
  ],
  compareDuplicate: [
    "Choose two different repositories and I’ll compare their contributor paths.",
    "Two sides need two different repos. Pick another contender for the comparison.",
    "Use distinct repositories so Algofox can compare two separate welcome paths.",
  ],
  compareRunning: [
    "Comparing two contributor paths: docs, setup, license, and newcomer issues.",
    "Running both welcome-path audits side by side.",
    "Checking which repository makes a first contribution easier to begin.",
  ],
  compareTie: [
    "It’s a tie. Both repositories show the same contributor-readiness score.",
    "Even match: the two contributor paths earned the same score.",
    "Algofox calls this one level. Both repositories landed on the same readiness mark.",
  ],
  compareWinner: [
    "{winner} takes this contributor-readiness round.",
    "{winner} leads this comparison on the current welcome signals.",
    "This round goes to {winner}. The audit found a stronger first-contributor path.",
  ],
  comparePartial: [
    "One result is ready. Check the other side’s message and try again if needed.",
    "Algofox finished one audit. The other result needs another look.",
    "A partial comparison is ready; review the remaining repository message for the next step.",
  ],
  compareFocus: [
    "Add two public GitHub repositories and I’ll compare the contributor paths.",
    "Enter two owner/repo paths to compare their first-contributor experience.",
    "Choose two public repositories and Algofox will place their welcome signals side by side.",
  ],
  nextMovePlanned: [
    "A practical next step is saved here on this device.",
    "Good plan. One honest improvement can make the path clearer.",
    "Small, real contributor work beats score chasing every time.",
  ],
  nextMoveWorking: [
    "Take the time you need. Clear contributor paths are built carefully.",
    "Nice. Keep the change focused and grounded in what the project actually does.",
    "A calm, well-scoped improvement is an excellent next move.",
  ],
  nextMoveCopied: [
    "Outline copied. Make every placeholder match the real project before publishing.",
    "Starter copied. Edit it to fit the project’s actual workflow.",
    "Copy secured. Verified project details make the artifact useful.",
  ],
  nextMoveRecheck: [
    "Checking the current public contributor signals when you are ready.",
    "Let’s look at the live repository evidence again.",
    "Fresh audit coming up. The public path gets the final say.",
  ],
  badgeCopied: [
    "Badge copied. Your README is ready for an Algofox-approved signal.",
    "Embed copied. Your contributor-health badge is ready to travel.",
    "Badge link secured. The README now has a clear route to this audit.",
  ],
  badgeReview: [
    "Reviewing this live badge style.",
    "Checking this badge layout in its live form.",
    "Algofox is previewing how this badge will read in a README.",
  ],
  loungeWelcome: [
    "Algofox is listening. Keep it practical and kind.",
    "Welcome to the lounge. Share useful contributor knowledge with care.",
    "The Dev Lounge is open. Practical questions make excellent starting points.",
  ],
  loungeScoreSent: [
    "Score shared. Algofox is cheering for practical contributor progress.",
    "Contributor score sent. Small improvements are worth sharing.",
    "The score card is in the lounge. Practical progress makes good conversation.",
  ],
  loungeMessageSent: [
    "Message sent. Keep the developer conversation constructive.",
    "Shared with the lounge. Practical context helps everyone contribute.",
    "Your note is live. Thoughtful contributor talk builds better projects.",
  ],
  loungeFocus: [
    "I’m listening. Keep it practical and kind.",
    "Drop a thoughtful contributor question or a useful answer here.",
    "Algofox is listening for practical open-source conversation.",
  ],
} as const;

export type AlgofoxMessageKey = keyof typeof messages;

let history: VariantHistory = {};

export function getAlgofoxMessage(key: AlgofoxMessageKey, values: Record<string, string> = {}) {
  const selection = selectNonRepeatingVariant(`mascot:${key}`, messages[key], history);
  history = selection.history;

  return selection.value.replace(/\{(\w+)\}/g, (_, name: string) => values[name] ?? "");
}
