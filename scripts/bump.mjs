import fs from 'fs/promises'
import { getPackageInfos } from "workspace-tools"

// Ensure all changes are committed
await $`git diff`

const files = []
const packages = getPackageInfos('.')

const targetAllowList = ["major", "minor", "patch"]
const target = process.argv[3]
if (!targetAllowList.includes(target)) {
  console.log("Error: invalid target")
  console.log("Usage:")
  console.log("  $ npx zx scripts/bump.mjs major|minor|patch")
  process.exit(1)
}

const rootPackageJson = require('../package.json')
const oldVersion = rootPackageJson.version
let [major, minor, patch] = oldVersion.split('.').map(x => parseInt(x, 10))
switch (target) {
  case "major":
    major += 1
    minor = 0
    patch = 0
    break
  case "minor":
    minor += 1
    patch = 0
    break
  case "patch":
    patch += 1
    break
}
const version = [major, minor, patch].join('.')
rootPackageJson.version = version

for (const pkg of Object.values(packages)) {
  const data = require(pkg.packageJsonPath)
  data.version = version
  for (const dep of Object.keys(data.dependencies)) {
    if (packages[dep] != null) { // internal deps
      pkg.dependencies[dep] = version
    }
  }
  files.push([pkg.packageJsonPath, data])
}

await fs.writeFile(path.join(__dirname, '..', 'package.json'), JSON.stringify(rootPackageJson, null, 2) + "\n")
for (const [f, packageJson] of files) {
  await fs.writeFile(f, JSON.stringify(packageJson, null, 2) + "\n")
}

await $`npm i`
await $`git add -A`
await $`git commit -m 'Bump version: ${oldVersion} -> ${version}'`
