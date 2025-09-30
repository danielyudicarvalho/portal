'use client';

import { useState } from 'react';

export default function TestGamePage() {
  const [error, setError] = useState<string | null>(null);

  const handleIframeError = () => {
    setError('Erro ao carregar o jogo');
  };

  const handleIframeLoad = () => {
    console.log('Jogo carregado com sucesso!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4">
        <h1 className="text-white text-2xl mb-4">Teste de Jogo</h1>
        {error && (
          <div className="text-red-500 mb-4 p-4 bg-red-100 rounded">
            {error}
          </div>
        )}
        <div className="mb-4">
          <a 
            href="/games/boom-dots/index.html" 
            target="_blank" 
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Abrir jogo diretamente (nova aba)
          </a>
        </div>
      </div>
      
      <div className="w-full" style={{ height: 'calc(100vh - 200px)' }}>
        <iframe
          src="/games/boom-dots/index.html"
          className="w-full h-full border-2 border-gray-600"
          title="Boom Dots Test"
          allow="fullscreen; gamepad; microphone; camera"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          onError={handleIframeError}
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
}