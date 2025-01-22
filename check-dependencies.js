const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

function checkDependencies(folder) {
  console.log(`Checking dependencies for ${folder}...`)

  const packageJsonPath = path.join(__dirname, folder, "package.json")

  if (!fs.existsSync(packageJsonPath)) {
    console.log(`No package.json found in ${folder}. Skipping...`)
    return
  }

  const nodeModulesPath = path.join(__dirname, folder, "node_modules")

  try {
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(`node_modules not found in ${folder}. Installing dependencies...`)
      execSync("yarn install", { cwd: path.join(__dirname, folder), stdio: "inherit" })
    } else {
      console.log(`Updating dependencies in ${folder}...`)
      try {
        execSync("yarn upgrade", { cwd: path.join(__dirname, folder), stdio: "inherit" })
      } catch (error) {
        console.log(`Error updating dependencies. Attempting to reinstall...`)
        execSync("rm yarn.lock", { cwd: path.join(__dirname, folder), stdio: "inherit" })
        execSync("yarn cache clean", { cwd: path.join(__dirname, folder), stdio: "inherit" })
        execSync("rm -rf node_modules", { cwd: path.join(__dirname, folder), stdio: "inherit" })
        execSync("yarn install", { cwd: path.join(__dirname, folder), stdio: "inherit" })
      }
    }

    console.log(`Dependencies check complete for ${folder}.`)

    console.log(`\nInstalled dependencies in ${folder}:`)
    const installedDeps = execSync("yarn list --depth=0", { cwd: path.join(__dirname, folder) }).toString()
    console.log(installedDeps)
  } catch (error) {
    console.error(`Error checking dependencies for ${folder}:`, error.message)
  }
}

// Check frontend dependencies
checkDependencies("frontend")

// Check backend dependencies
checkDependencies("backend")

console.log("All dependency checks complete.")





