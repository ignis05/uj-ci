# abort on errors
set -e

git init
git add -A
git commit -m 'deploy through script'
git push -f git@github.com:ignis05/uj-ci.git master:gh-pages

# remove tmp git repo
rm -rf .git
