import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const build = new URL('../dist/', import.meta.url);
const files = (await readdir(build, { recursive: true, withFileTypes: true }))
  .filter(file => file.isFile() && file.name !== 'sw.js')
  .map(file => pathToFileURL(join(file.parentPath, file.name)))
  .sort((a, b) => a.href.localeCompare(b.href));
const version = createHash('sha256').update(await readFile(new URL(import.meta.url)));
const paths = [];
for (const file of files) {
  const path = '/' + file.href.slice(build.href.length);
  version.update(path).update(await readFile(file));
  paths.push(path === '/index.html' ? '/' : path);
}

await writeFile(new URL('sw.js', build), `
const cacheName = 'astra-bio-${version.digest('hex').slice(0, 16)}';
const cachedPaths = ${JSON.stringify(paths)};
const assets = new Set(cachedPaths);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(cachedPaths.map(path => new Request(path, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('astra-bio-') && key !== cacheName).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' && ['/', '/index.html'].includes(url.pathname)) {
    event.respondWith(fetch(event.request).catch(async () => (await caches.open(cacheName)).match('/')));
  } else if (assets.has(url.pathname)) {
    event.respondWith((async () => (await (await caches.open(cacheName)).match(url.pathname)) ?? fetch(event.request))());
  }
});
`);
