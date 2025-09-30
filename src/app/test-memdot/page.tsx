'use client';

export default function TestMemdotPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-2xl mb-4">Memdot Game Test</h1>
        <div className="bg-black rounded-lg overflow-hidden">
          <iframe
            src="/games/memdot/index.html"
            className="w-full h-96 border-0"
            title="Memory Dots Test"
            allow="fullscreen; gamepad; microphone; camera"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
        <div className="mt-4 text-white">
          <p>If you see a loading screen, check the browser console for errors.</p>
          <p>The game should load with a blue background and colored circles.</p>
        </div>
      </div>
    </div>
  );
}