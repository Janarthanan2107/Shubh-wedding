import { validateAssets } from "../src/lib/assets";

const issues = validateAssets();
if (issues.length) {
  for (const issue of issues) console.error(`${issue.template}: ${issue.message}`);
  process.exit(1);
}
console.log("Template assets valid");
