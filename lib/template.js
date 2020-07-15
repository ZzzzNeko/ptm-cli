const fse = require("fs-extra");
const chalk = require("chalk");
const { getPackagePath } = require("./convert");

const templateInfoPath = getPackagePath("tpl/template.json");

/**
 * 替换 template.json 信息
 * @param { object } templates 模板信息
 * @param { string | false= } successLog 传递 false 时不输出日志
 */
async function writeTemplates(templates, successLog) {
  await fse
    .writeJSON(templateInfoPath, templates, { spaces: "  " })
    .catch((error) => {
      console.log(chalk.red("======== 写入模板信息失败 ========"));
      console.log(error);
      console.log(chalk.red("=================================="));
      process.exit(1);
    });
  if (successLog === false) return;
  console.log(chalk.grey(successLog || "写入模板信息成功"));
}

/**
 * 获取模板信息
 * @param { string= } name 模板名称
 */
async function getTemplateInfo(name) {
  const isExist = await fse.exists(templateInfoPath);
  if (!isExist) {
    const tplDirPath = getPackagePath("tpl");
    const isDirExist = await fse.exists(tplDirPath);
    if (!isDirExist) await fse.mkdir(tplDirPath);
    console.log(chalk.grey("缺少 template.json 文件"));
    console.log(chalk.grey("创建 template.json 文件"));
    await writeTemplates({}, false);
    return {};
  } else {
    const templates =
      (await fse.readJSON(templateInfoPath).catch((error) => {
        console.log(chalk.red("======== 获取模板信息失败 ========"));
        console.log(error);
        console.log(chalk.red("=================================="));
      })) || {};
    return name ? templates[name] : templates;
  }
}

/**
 * 设置模板信息
 * @param { string } name 模板名称
 * @param { object } value 模板信息
 */
async function setTemplateInfo(name, value) {
  const templates = await getTemplateInfo();
  const oldInfo = templates[name];
  templates[name] = oldInfo ? Object.assign(oldInfo, value) : value;
  await writeTemplates(templates);
}

/**
 * 删除模板信息
 * @param { string } name 模板名称
 */
async function delTemplateInfo(name) {
  const templates = await getTemplateInfo();
  delete templates[name];
  await writeTemplates(templates);
}

module.exports = {
  writeTemplates,
  getTemplateInfo,
  setTemplateInfo,
  delTemplateInfo,
};
