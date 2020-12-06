git checkout release
git pull
git merge master --no-commit --no-ff
npm run docs
git add .
git commit -m 'Release'
git push
git checkout master
