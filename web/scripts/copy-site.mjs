// Copies the static landing page (repo-root /site) into public/ so the app serves it at "/".
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..', '..', 'site');
const pub = join(here, '..', 'public');
if (!existsSync(site)) { console.log('copy-site: no ../site folder, skipping'); process.exit(0); }
mkdirSync(pub, { recursive: true });
copyFileSync(join(site, 'styles.css'), join(pub, 'styles.css'));
// When served by the app itself, the app is same-origin: blank the absolute app URL.
const html = readFileSync(join(site, 'index.html'), 'utf8').replace(/<meta name="wtfit-app" content="[^"]*">/, '<meta name="wtfit-app" content="">');
writeFileSync(join(pub, 'landing.html'), html);
console.log('copy-site: landing copied');
