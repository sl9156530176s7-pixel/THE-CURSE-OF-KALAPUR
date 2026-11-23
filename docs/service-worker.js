/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-02894ca7'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "privacy-policy.html",
    "revision": "a9b4798bf3685db3136cba1d51b4e14f"
  }, {
    "url": "offline.html",
    "revision": "e9d6f9d3d445c32c20ff72bb8b2d1002"
  }, {
    "url": "manifest.webmanifest",
    "revision": "7df85475da5ff659a238c65d540cfccc"
  }, {
    "url": "manifest.json",
    "revision": "7df85475da5ff659a238c65d540cfccc"
  }, {
    "url": "kalapur-cover.jpg",
    "revision": "5ee6d2402b0a0c5fd0e14d09e1a5ec20"
  }, {
    "url": "index.html",
    "revision": "1680e1edd9c1c0c5821dfc8a2c8d678e"
  }, {
    "url": "favicon.svg",
    "revision": "d8334d4ff07ed925f40135fc3ffcc00c"
  }, {
    "url": "screenshots/poster-wide.jpg",
    "revision": "6a23c484b6729d668b6cb85d8de56e60"
  }, {
    "url": "screenshots/mobile-portrait.jpg",
    "revision": "bc018e431cf0d5183a680ce29e567c7b"
  }, {
    "url": "screenshots/gameplay-haveli.jpg",
    "revision": "41d3c11ef14927d3cb0934c9325f0d64"
  }, {
    "url": "screenshots/environment-sanctum.jpg",
    "revision": "e33bd106e316fca784b68d267f66f19a"
  }, {
    "url": "screenshots/character-tatya.jpg",
    "revision": "3203663f12ae8f0c9ef65053fcf0450a"
  }, {
    "url": "screenshots/action-escape.jpg",
    "revision": "a43b43f6ca8d6eb8c74a550767023d73"
  }, {
    "url": "icons/icon-maskable-512x512.png",
    "revision": "3c707b53a5e7efb3d7ff979e4748a58b"
  }, {
    "url": "icons/icon-maskable-192x192.png",
    "revision": "4aa490103abac5124dc5ed591807a724"
  }, {
    "url": "icons/icon-96x96.png",
    "revision": "ae067f7cbe55bee202c4ceef8edfa9bc"
  }, {
    "url": "icons/icon-72x72.png",
    "revision": "d44bd13708493117a855f5dc2e444bdf"
  }, {
    "url": "icons/icon-512x512.png",
    "revision": "12ea97cc730b164b1d953933900c3a98"
  }, {
    "url": "icons/icon-384x384.png",
    "revision": "ccdf0fd4f02bc0189b78d8f15353b4db"
  }, {
    "url": "icons/icon-192x192.png",
    "revision": "04ea00abc014bfb0f004eac81ed2af5f"
  }, {
    "url": "icons/icon-152x152.png",
    "revision": "3a11ca78841d51967476601d17a69614"
  }, {
    "url": "icons/icon-144x144.png",
    "revision": "36c4f3de2e2f4a7d1ea3d93f1d2187a1"
  }, {
    "url": "icons/icon-128x128.png",
    "revision": "1b216be3fb63bb9262aee9d3e9182699"
  }, {
    "url": "icons/apple-touch-icon.png",
    "revision": "a13a88b3b44e58a1b358eea91493fd1c"
  }, {
    "url": "assets/vendor-ui-B9oDM_f8.js",
    "revision": null
  }, {
    "url": "assets/vendor-three-XsDbzRof.js",
    "revision": null
  }, {
    "url": "assets/rolldown-runtime-BWaJ3C7D.js",
    "revision": null
  }, {
    "url": "assets/kalapur_official_logo_1793628694332-B4d8jVKw.jpg",
    "revision": null
  }, {
    "url": "assets/index-BeHa2R8v.css",
    "revision": null
  }, {
    "url": "assets/index-3OmvBycb.js",
    "revision": null
  }, {
    "url": "assets/GameCanvas-BJRWr3Tq.js",
    "revision": null
  }, {
    "url": "assets/aistudio/image_476c18a2.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Untitled_c0ca65a3.mp3",
    "revision": null
  }, {
    "url": "assets/aistudio/Count_the_Doors_e8e142b1.mp3",
    "revision": null
  }], {
    "directoryIndex": "index.html",
    "ignoreURLParametersMatching": [/.*/]
  });
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /offline\.html$/, /privacy-policy\.html$/]
  }));
  workbox.registerRoute(({
    url
  }) => url.pathname.endsWith("version.json"), new workbox.NetworkOnly(), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "google-fonts-stylesheets",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-webfonts",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
