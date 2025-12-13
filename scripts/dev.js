#!/usr/bin/env node

/**
 * Custom dev server script that shows multi-tenant URLs
 */

const { spawn } = require('child_process');

const PORT = 5555;

const TENANT_URLS = `
   🍳 Chef Agent - Kitchen Display System
   ────────────────────────────────────────
   - Local:         http://localhost:${PORT}/kitchen
   - Pista House:   http://pistahouse.chef.local:${PORT}/kitchen
   - Chutneys:      http://chutneys.chef.local:${PORT}/kitchen
   ────────────────────────────────────────
   - A2A Endpoint:  http://localhost:${PORT}/api/a2a
   - Agent Card:    http://localhost:${PORT}/.well-known/agent-card.json
`;

// Start Next.js dev server
const next = spawn('npx', ['next', 'dev', '--port', PORT.toString()], {
  stdio: 'inherit',
  shell: true
});

// Show tenant URLs after a short delay (wait for Next.js to start)
setTimeout(() => {
  console.log(TENANT_URLS);
}, 3000);

next.on('close', (code) => {
  process.exit(code);
});
