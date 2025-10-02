interface CountdownOverlayProps {
  countdownValue: number;
}

function CountdownOverlay({ countdownValue }: CountdownOverlayProps) {
  if (countdownValue <= 0) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-50 dark:bg-slate-900 bg-opacity-20 rounded-2xl">
      <div className="text-center">
        <div className="relative">
          <div className="text-7xl font-black text-green-500 dark:text-green-500 animate-pulse mb-4">
            {countdownValue}
          </div>
        </div>
        <p className="text-xl font-bold text-slate-800 dark:text-slate-200 opacity-90">
          Get ready to trade!
        </p>
      </div>
    </div>
  );
}

export default CountdownOverlay;
