'use client';

import { useEffect, useRef } from 'react';
import { colors, spacing, typography, getContrastPair } from '@/lib/design-tokens';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

function createReferenceId(error: Error & { digest?: string }) {
  const source = [error.digest, error.name, error.message, error.stack].filter(Boolean).join(':');
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return `SK-${hash.toString(16).toUpperCase().padStart(8, '0').slice(-8)}`;
}

export function reloadPage(reloader: Pick<Location, 'reload'> = window.location) {
  reloader.reload();
}

export const globalErrorActions = {
  reloadPage,
};

export default function GlobalError({ error, reset }: Props) {
  const isProduction = process.env.NODE_ENV === 'production';
  const referenceId = createReferenceId(error);
  const errorCode = error.digest ?? error.name ?? 'UNHANDLED_ERROR';
  const stackTrace = error.stack ?? error.message;
  const issueTitle = isProduction
    ? `500 Error Reference: ${referenceId}`
    : `500 Error: ${error.message || 'Unknown error'}`;
  const issueBody = isProduction
    ? `**Reference ID:** ${referenceId}\n\n**Steps to reproduce:**\n\n`
    : `**Error code:** ${errorCode}\n\n**Stack trace:**\n\n\`\`\`\n${stackTrace}\n\`\`\`\n\n**Steps to reproduce:**\n\n`;
  const issueUrl = `https://github.com/teslims2/StellarKraal-/issues/new?title=${encodeURIComponent(
    issueTitle
  )}&body=${encodeURIComponent(issueBody)}`;

  useEffect(() => {
    if (isProduction) {
      console.error('[GlobalError]', error, { referenceId });
    }
  }, [error, isProduction, referenceId]);

  const contrast = getContrastPair('light');

  return (
    <html lang="en">
      <body className={`min-h-screen ${contrast.bg} px-4 ${contrast.text}`}>
        <main
          aria-describedby="global-error-description"
          aria-labelledby="global-error-title"
          aria-live="assertive"
          className={`mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center py-12 text-center ${spacing.space8}`}
          role="main"
        >
          <div aria-hidden="true" className={spacing.space6}>
            <svg
              width="140"
              height="140"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Lost cow illustration"
            >
              <circle cx="60" cy="60" r="56" fill="#FDF6EC" stroke="#D4A017" strokeWidth="3" />
              <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="52">
                🐄
              </text>
            </svg>
          </div>

          <p className={`${typography.label} mb-3 font-semibold uppercase tracking-normal ${colors.status.error.text}`}>
            Error 500
          </p>
          <h1 id="global-error-title" className={`${typography.heading.h1} mb-3`}>
            Something went wrong
          </h1>
          <p id="global-error-description" className={`${typography.body.default} mb-6 max-w-xl ${contrast.text.replace('text-', 'text-opacity-80 ')}`}>
            An unexpected error interrupted this page. Reload the page or share the reference
            details with support.
          </p>

          {isProduction ? (
            <section
              aria-label="Support reference"
              className={`mb-8 w-full rounded-lg border ${colors.form.input} ${contrast.bg} p-4 text-left`}
            >
              <p className={`${typography.label} mb-1`}>Support reference</p>
              <p className={`font-mono ${typography.body.sm} ${contrast.text}`}>{referenceId}</p>
            </section>
          ) : (
            <section
              aria-label="Development error details"
              className={`mb-8 w-full rounded-lg border ${colors.form.input} ${contrast.bg} p-4 text-left`}
            >
              <dl className={`mb-4 grid gap-3 sm:grid-cols-2`}>
                <div>
                  <dt className={typography.label}>Error code</dt>
                  <dd className={`break-words font-mono ${typography.body.sm} ${contrast.text}`}>{errorCode}</dd>
                </div>
                <div>
                  <dt className={typography.label}>Message</dt>
                  <dd className={`break-words font-mono ${typography.body.sm} ${contrast.text}`}>{error.message}</dd>
                </div>
              </dl>
              <p className={`${typography.label} mb-2`}>Stack trace</p>
              <pre className={`max-h-80 overflow-auto whitespace-pre-wrap rounded-lg ${contrast.bg} p-4 text-left font-mono ${typography.caption} ${contrast.text.replace('text-', 'text-opacity-70 ')}`}>
                {stackTrace}
              </pre>
            </section>
          )}

          <div className={`flex flex-col justify-center gap-3 sm:flex-row`}>
            <button
              className={`rounded-lg ${colors.primary.bg} px-6 py-3 font-semibold ${colors.primary.text} transition ${colors.primary.hover} ${colors.interactive.focus}`}
              onClick={() => globalErrorActions.reloadPage()}
              type="button"
            >
              Try Again
            </button>
            <a
              className={`rounded-lg border ${colors.primary.border} px-6 py-3 font-semibold ${contrast.text} transition hover:bg-brown/5 ${colors.interactive.focus}`}
              href="/"
            >
              Go Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
