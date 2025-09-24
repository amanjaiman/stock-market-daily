interface GameModalProps {
  startingCash: number;
  startingStockPrice: number;
  targetValue: number;
  onStart: () => void;
}

function GameModal({
  startingCash,
  startingStockPrice,
  targetValue,
  onStart,
}: GameModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-md bg-opacity-20"></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl card-shadow p-8 max-w-md mx-4 w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl flex items-center justify-center mx-auto mb-4 card-shadow">
            <span className="text-white font-black text-3xl">📈</span>
          </div>
          <h1 className="text-3xl font-black text-gray-700 mb-2">
            Stock Market Challenge
          </h1>
          <p className="text-gray-500 font-semibold">
            90 seconds to grow your portfolio
          </p>
        </div>

        {/* Rules */}
        <div className="space-y-4 mb-8">
          <div className="bg-slate-50 rounded-2xl p-4">
            <h3 className="text-lg font-bold text-gray-700 mb-3">Game Rules</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                You have <strong>90 seconds</strong> to trade
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Buy and sell shares as the price changes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Reach the target portfolio value to win
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
            <h3 className="text-lg font-bold text-gray-700 mb-3">
              Starting Conditions
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500 font-semibold">Cash</p>
                <p className="text-lg font-black text-gray-700">
                  {formatCurrency(startingCash)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold">Stock Price</p>
                <p className="text-lg font-black text-blue-600">
                  {formatCurrency(startingStockPrice)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold">Shares</p>
                <p className="text-lg font-black text-gray-700">0</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-yellow-200">
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              🎯 Target Goal
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Grow your total portfolio value to:
            </p>
            <p className="text-3xl font-black text-orange-600">
              {formatCurrency(targetValue)}
            </p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-xl py-4 px-8 rounded-2xl floating-button bounce-click transition-all duration-200"
        >
          Start Challenge
        </button>
      </div>
    </div>
  );
}

export default GameModal;
