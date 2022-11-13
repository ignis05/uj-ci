# abort on errors
set -e

# clear output
rm dist/bundle.js

# build
npx webpack

# navigate into the build output directory
cd dist
git init
git add -A
git commit -m 'deploy through script'
git push -f git@github.com:ignis05/uj-ci.git master:gh-pages

# remove tmp git repo
rm -rf .git
