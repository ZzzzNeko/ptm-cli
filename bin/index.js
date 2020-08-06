#! node
const package = require("../package.json");
const commander = require("commander");

function loadCommand(command) {
  return require(`../cmd/${command}`);
}

commander.version(package.version).usage("<command> [options]");

commander
  .command("create")
  .arguments("[projectName] [projectPath]")
  .description("创建项目")
  .action(function (projectName, projectPath, command) {
    loadCommand("create")({ projectName, projectPath }, null);
  });

commander
  .command("select")
  .arguments("[template]")
  .description("查看模板")
  .action(function (template, command) {
    loadCommand("select")({ template }, null);
  });

commander
  .command("insert")
  .arguments("[template]")
  .description("添加模板")
  .action(function (template, command) {
    loadCommand("insert")({ template }, null, false);
  });

commander
  .command("update")
  .arguments("[template]")
  .description("更新模板")
  .action(function (template, command) {
    loadCommand("update")({ template }, null, true);
  });

commander
  .command("delete")
  .arguments("[template]")
  .description("删除模板")
  .action(function (template, command) {
    loadCommand("delete")({ template }, null);
  });

commander
  .command("rename")
  .arguments("[oldName] [newName]")
  .description("模板改名")
  .action(function (oldName, newName, command) {
    loadCommand("rename")({ oldName, newName }, null);
  });

commander.parse(process.argv);
