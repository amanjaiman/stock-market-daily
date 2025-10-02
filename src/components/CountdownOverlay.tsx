interface CountdownOverlayProps {
  countdownValue: number;
  showStartButton?: boolean;
  onStartClick?: () => void;
}

function CountdownOverlay({
  countdownValue,
  showStartButton = false,
  onStartClick,
}: CountdownOverlayProps) {
  if (countdownValue <= 0 && !showStartButton) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-50 dark:bg-slate-900 bg-opacity-20 rounded-2xl">
      <div className="text-center">
        {showStartButton ? (
          <div className="space-y-6">
            <button
              onClick={onStartClick}
              className="font-medium text-lg py-4 px-8 rounded-3xl floating-button bounce-click transition-all duration-200 bg-green-500 hover:bg-green-600 text-white"
            >
              Start Challenge
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="text-7xl font-black text-green-500 dark:text-green-500 animate-pulse mb-4">
                {countdownValue}
              </div>
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200 opacity-90">
              Get ready to trade!
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default CountdownOverlay;
