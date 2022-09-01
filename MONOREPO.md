# Commands:
 - yarn install - install everything
 - yarn studio - run dev studio
 - yarn docs - run dev docs

## To add a dependency
You gotta cd into the folder then do `yarn add` like normal.


# To add a project:
 - Create the folder (For this example, it'll be called `newproject`)
 - Add the scripts to `./package.json` (`precommit:newproject`, `install:newproject` and `newproject` )
 - Copy the .lintstagedrc.js from `/studio/.lintstagedrc.js` to `newproject/.lintstagedrc.js`
 - Make sure `lint-staged` is installed in `newproject`.
 - Add a `precommit` script to `newproject/package.json`. It should be `lint-staged`.