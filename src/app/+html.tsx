import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { COLORS } from '@/constants/theme';

// Customizes the root HTML document for the web build (native ignores this file entirely).
// `viewport-fit=cover` is required for safe-area-inset-* to report real values on iOS
// Safari — without it, content padded for the home indicator / browser chrome can end up
// clipped at the bottom instead of sitting above it.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `html, body, #root { height: 100%; background-color: ${COLORS.background}; }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
