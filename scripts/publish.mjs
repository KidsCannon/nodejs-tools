// Ensure all changes are committed
await $`git diff`

$`npm run clean`
$`npm run build`
$`npm run publish`
