interface CountdownOverlayProps {
  countdownValue: number;
}

function CountdownOverlay({ countdownValue }: CountdownOverlayProps) {
  if (countdownValue <= 0) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-opacity-20 backdrop-blur-sm">
      <div className="text-center">
        <div className="relative">
          <div
            className="text-9xl font-black text-emerald-500 animate-pulse mb-4"
            style={{
              textShadow:
                "0 0 20px rgba(16,185,129,0.5), 0 0 40px rgba(16,185,129,0.3)",
              animation: "pulse 1s ease-in-out",
            }}
          >
            {countdownValue}
          </div>
          <div className="absolute inset-0 text-9xl font-black text-emerald-300 opacity-30 blur-sm">
            {countdownValue}
          </div>
        </div>
        <p className="text-2xl font-bold text-white opacity-90">
          Get ready to trade!
        </p>
      </div>
    </div>
  );
}

export default CountdownOverlay;
