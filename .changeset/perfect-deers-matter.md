---
'@rosen-bridge/watcher': minor
---

Improve the size of Docker image:

- improve GA for using cache while building the image
- improve Docker build to use cache as much as possible and do not store unneeded files in the image
- Add `|| true` for husky in prepare to work with `NODE_ENV=production` set before `npm ci`
