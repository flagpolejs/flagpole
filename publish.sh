#!/bin/bash

npm run build
cp README.md dist/README.md
cp package.json dist/package.json
sed -i '' 's#"main": "./dist/index.js"#"main": "./index.js"#g' dist/package.json
sed -i '' 's#"scripts": #"flo-scripts": #g' dist/package.json
#sed -i '' 's#"bin": #"flo-bin": #g' dist/package.json
sed -i '' 's#"flagpole": "./dist/cli.js"#"flagpole": "./cli.js"#g' dist/package.json

cd ./dist
npm publish