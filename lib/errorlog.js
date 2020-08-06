const chalk = require("chalk");
const onPromptCancel = (propmt) => {
  console.log("");
  console.log(chalk.magentaBright("   Exit"));
  process.exit(1);
};
module.exports = {
  onPromptCancel,
};
