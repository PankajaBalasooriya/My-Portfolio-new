/**
 * Run Lighthouse against the production build and fail below a threshold.
 *
 *   pnpm lighthouse                      # audits / on a local preview server
 *   pnpm lighthouse --url <url>          # audits a deployed URL instead
 *   pnpm lighthouse --path /blog         # a different route on the preview
 *   pnpm lighthouse --min 90             # lower the bar (default 95)
 *   pnpm lighthouse --verbose            # also list every failing audit
 *
 * Assumes `pnpm build` has already run when auditing the local preview.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const MIN = Number(argValue('--min') ?? 95);
const PATH_ = argValue('--path') ?? '/';
const EXPLICIT_URL = argValue('--url');
const PORT = Number(argValue('--port') ?? 4325);
const VERBOSE = process.argv.includes('--verbose');

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

/** Start `astro preview` and resolve once it is accepting connections. */
async function startPreview() {
  const child = spawn(
    process.execPath,
    ['node_modules/astro/astro.js', 'preview', '--port', String(PORT)],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  const origin = `http://localhost:${PORT}`;
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('astro preview exited early');
    try {
      const res = await fetch(origin, { signal: AbortSignal.timeout(1000) });
      if (res.ok || res.status === 404) return { child, origin };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  child.kill();
  throw new Error(`preview server did not start on ${origin}`);
}

async function main() {
  let server;
  let target = EXPLICIT_URL;

  if (!target) {
    server = await startPreview();
    // The preview honours `base`, so build the URL from what it actually serves.
    const base = process.env.PUBLIC_BASE ?? '/';
    const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
    target = `${server.origin}${prefix}${PATH_}`;
  }

  console.log(`Auditing ${target}\n`);

  const { default: lighthouse } = await import('lighthouse');
  const chromeLauncher = require('chrome-launcher');

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });

  try {
    const result = await lighthouse(target, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      // Mobile emulation with throttling — the default, and the harsher bar.
      formFactor: 'mobile',
      screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75 },
    });

    if (!result?.lhr) throw new Error('Lighthouse returned no result');

    const categories = Object.values(result.lhr.categories);
    let failed = 0;

    for (const c of categories) {
      const score = Math.round((c.score ?? 0) * 100);
      const ok = score >= MIN;
      if (!ok) failed++;
      console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${c.title.padEnd(18)} ${String(score).padStart(3)}`);
    }

    if (VERBOSE) {
      for (const c of categories) {
        const failing = c.auditRefs
          .map((ref) => ({ ref, audit: result.lhr.audits[ref.id] }))
          .filter(({ audit }) => audit && audit.score !== null && audit.score < 1);
        if (!failing.length) continue;
        console.log(`\n  ${c.title} — failing audits:`);
        for (const { ref, audit } of failing) {
          console.log(`    - ${audit.id} (weight ${ref.weight}): ${audit.title}`);
          for (const item of (audit.details?.items ?? []).slice(0, 3)) {
            const selector = item.node?.selector;
            if (selector) console.log(`        ${selector}`);
          }
        }
      }
    }

    console.log();
    if (failed) {
      console.error(`${failed} categor${failed === 1 ? 'y' : 'ies'} below ${MIN}.`);
      process.exitCode = 1;
    } else {
      console.log(`All categories >= ${MIN}.`);
    }
  } finally {
    await chrome.kill();
    server?.child.kill();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
