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
      <span className="font-mono font-bold tracking-tight text-accent">WelcomeScore</span>
      <span
        className={`mt-0.5 inline-flex rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-accent sm:mt-2 sm:px-2 sm:py-1 ${badgeClassName}`}
      >
        .js.org
      </span>
    </span>
  );
}
