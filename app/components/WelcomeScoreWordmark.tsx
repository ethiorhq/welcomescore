type WelcomeScoreWordmarkProps = {
  className?: string;
  badgeClassName?: string;
};

export default function WelcomeScoreWordmark({
  className = "",
  badgeClassName = "",
}: WelcomeScoreWordmarkProps) {
  return (
    <span className={`inline-flex items-start gap-2 ${className}`}>
      <span className="font-mono font-bold tracking-tight">WelcomeScore</span>
      <span
        className={`mt-0.5 inline-flex rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-500 sm:mt-2 sm:px-2 sm:py-1 ${badgeClassName}`}
      >
        .js.org
      </span>
    </span>
  );
}
