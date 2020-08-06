const fse = require("fs-extra");
const chalk = require("chalk");
const prompts = require("prompts");
const { getTemplateInfo, delTemplateInfo } = require("../lib/template");
const { getPackagePath } = require("../lib/convert");
const { onPromptCancel } = require("../lib/errorlog");

function generateQuestions(name) {
  const questions = [
    {
      type: "text",
      name: "template",
      message: "模板名称",
    },
  ];
  if (name) questions.shift();
  return questions;
}

async function deleteTemplate(name) {
  const cacheTemplatePath = getPackagePath("tpl/", name); // 缓存模板路径
  await fse.remove(cacheTemplatePath).catch((error) => {
    console.log(chalk.red("======== 模板删除异常 ========"));
    console.log(error);
    console.log(chalk.red("=============================="));
  });
  console.log(chalk.grey("模板缓存删除成功"));
  await delTemplateInfo(name);
  console.log(chalk.green("Finish!!!"));
}

/**
 * 删除指定模板
 * @param { object } args { template? }
 * @param { object | null } opts 暂为 null
 */
async function remove(args, opts) {
  const templates = await getTemplateInfo();

  if (args.template && !Object.keys(templates).includes(args.template)) {
    return console.log(chalk.red("模板不存在"));
  }
  const questions = generateQuestions(args.template);
  const result =
    questions.length > 0
      ? await prompts(questions, { onCancel: onPromptCancel })
      : {};
  const { template = args.template } = result;
  await deleteTemplate(template);
}

module.exports = remove;
