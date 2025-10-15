export default function SignInLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-darker via-gaming-dark to-gaming-darker flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gaming-accent to-gaming-secondary rounded-2xl mb-4 shadow-lg animate-pulse">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white font-gaming mb-2">Loading...</h1>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-gaming-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gaming-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gaming-success rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}