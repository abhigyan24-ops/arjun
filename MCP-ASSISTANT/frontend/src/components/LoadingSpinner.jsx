function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#222222] border-t-[#7c3aed] rounded-full animate-spin mb-6"></div>
      <p className="text-gray-400 text-lg animate-pulse">
        Analyzing your workspace...
      </p>
    </div>
  )
}

export default LoadingSpinner
