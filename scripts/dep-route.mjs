import fs from 'fs/promises'
import path from 'path'

$.verbose = false

const format = (packageLockJson, target) => {
  const p = target.startsWith('packages/')
    ? packageLockJson.packages[target]
    : packageLockJson.packages[`node_modules/${target}`]
  return `${target}@${p.version}`
}

const depRoute = (packageLockJson, target, result = []) => {
  for (const pkgKey of Object.keys(packageLockJson.packages)) {
    const pkg = packageLockJson.packages[pkgKey]
    const pkgName = pkgKey.replace(/^node_modules\//, '')
    if (pkg.dependencies?.[target] != null) {
      result.push(format(packageLockJson, pkgName))
      return depRoute(packageLockJson, pkgName, result)
    } else if (pkg.devDependencies?.[target] != null) {
      result.push('[devDependencies]')
      result.push(format(packageLockJson, pkgName))
      return depRoute(packageLockJson, pkgName, result)
    }
  }
  return result
}

const target = process.argv[3]
if (target == null) {
  console.log(`Usage: $ npx zx scripts/dep-route.mjs <dep>`)
  process.exit(1)
}

const packageLockJsonPath = path.join(__dirname, '..', 'package-lock.json')
const packageLockJson = JSON.parse((await fs.readFile(packageLockJsonPath)).toString('utf-8'))
const result = depRoute(packageLockJson, target, [format(packageLockJson, target)])
console.log(result.join(' <- '))
