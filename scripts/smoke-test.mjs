#!/usr/bin/env node
/**
 * Route smoke test — verifies no routes return 404.
 * Usage: node scripts/smoke-test.mjs [port]
 *
 * Expects the dev server to already be running.
 * Auth-gated routes should return 302/307 (redirect to /login), not 404.
 */

const PORT = process.argv[2] || 3000;
const BASE = `http://localhost:${PORT}`;

const ROUTES = [
  // Public routes
  { path: "/", expect: 200 },
  { path: "/listings", expect: 200 },
  { path: "/login", expect: 200 },
  { path: "/signup", expect: 200 },

  // Auth-gated routes — should redirect (302/307), NOT 404
  { path: "/dashboard", expect: "redirect" },
  { path: "/jobs", expect: "redirect" },
  { path: "/messages", expect: "redirect" },
  { path: "/settings", expect: "redirect" },
  { path: "/listings/new", expect: "redirect" },
];

async function test() {
  let passed = 0;
  let failed = 0;

  for (const route of ROUTES) {
    try {
      const res = await fetch(`${BASE}${route.path}`, { redirect: "manual" });
      const status = res.status;

      if (route.expect === "redirect") {
        if (status === 302 || status === 307 || status === 200) {
          console.log(`  PASS  ${route.path} → ${status}`);
          passed++;
        } else {
          console.log(`  FAIL  ${route.path} → ${status} (expected redirect or 200)`);
          failed++;
        }
      } else {
        if (status === route.expect) {
          console.log(`  PASS  ${route.path} → ${status}`);
          passed++;
        } else {
          console.log(`  FAIL  ${route.path} → ${status} (expected ${route.expect})`);
          failed++;
        }
      }
    } catch (err) {
      console.log(`  FAIL  ${route.path} → Connection error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${ROUTES.length} routes`);
  process.exit(failed > 0 ? 1 : 0);
}

test();
