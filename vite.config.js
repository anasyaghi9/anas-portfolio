import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { contactInbox } from './server/contact-inbox.js';

const INBOX = fileURLToPath(new URL('./messages/inbox.md', import.meta.url));

// Vite 8's own list (setting `deny` replaces it), plus the contact inbox, which holds visitors'
// details. contactInbox() also blocks the folder itself, before Vite handles the request.
const DENY = ['.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**', '**/messages/**'];

export default defineConfig({
  plugins: [react(), tailwindcss(), contactInbox({ file: INBOX })],
  server: {
    fs: { deny: DENY },
  },
  test: {
    environment: 'node',
  },
});
