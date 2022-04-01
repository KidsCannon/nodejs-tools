import { getBranchName } from "workspace-tools"

const branch = getBranchName('.')
if (branch !== 'main') {
  console.log('Error: bump should be executed in main branch')
  process.exit(1)
}

// Ensure all changes are committed
await $`git diff`

$`npm run clean`
$`npm run build`
$`npm run publish`
