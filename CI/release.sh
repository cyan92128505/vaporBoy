git checkout release
git pull
npm run docs
git add .
git commit -m 'Release'
git push
git checkout master
