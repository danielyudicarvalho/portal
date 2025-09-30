'use client';

import { Layout } from '@/components/layout';

export default function NumbersPage() {
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-black -mx-3 sm:-mx-4 lg:-mx-6 -my-4 sm:-my-6 lg:-my-8">
        <div className="w-full h-screen">
          <iframe
            src="/games/123/index.html"
            className="w-full h-full border-0"
            title="123"
            allow="fullscreen; gamepad; microphone; camera"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    </Layout>
  );
}