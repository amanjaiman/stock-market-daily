interface TimerProps {
  timeRemaining: number;
  currentValue: number;
  targetValue: number;
  formatCurrency: (amount: number) => string;
}

function Timer({
  timeRemaining,
  currentValue,
  targetValue,
  formatCurrency,
}: TimerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const timeColor =
    timeRemaining > 30
      ? "text-emerald-500"
      : timeRemaining > 10
      ? "text-yellow-500"
      : "text-red-500 animate-pulse";

  const formatTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const progressPercent = Math.min((currentValue / targetValue) * 100, 100);
  const remaining = Math.max(targetValue - currentValue, 0);

  return (
    <div className="bg-slate-50 rounded-2xl p-4 card-shadow min-w-[280px]">
      <div className="flex items-center justify-center gap-2 mb-3">
        <svg
          className={`w-6 h-6 ${timeColor}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className={`text-2xl font-black ${timeColor}`}>{formatTime}</span>
      </div>

      {/* Portfolio Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-semibold">Current:</span>
          <span className="font-black text-gray-700">
            {formatCurrency(currentValue)}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-semibold">Need:</span>
          <span className="font-bold text-orange-600">
            {formatCurrency(remaining)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress to {formatCurrency(targetValue)}</span>
            <span>{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timer;
