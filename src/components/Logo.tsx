export function Logo() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded border border-sky-400/35 bg-sky-400/10 shadow-glow">
      <div className="relative h-7 w-7 rounded-full border border-sky-300">
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-sky-300/70" />
        <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-sky-300/70" />
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-alert" />
      </div>
    </div>
  );
}
