const ora = require("ora");
const fse = require("fs-extra");
const chalk = require("chalk");
const prompts = require("prompts");
const download = require("download-git-repo");
const { getPackagePath, getProcessPath } = require("../lib/convert");
const { setTemplateInfo, getTemplateInfo } = require("../lib/template");
const { resolve } = require("path");
const walk = require("ignore-walk");

function getSourceTypeLabel(type) {
  if (type === "local") return "本地模板";
  if (type === "remote") return "远端模板";
}

function isTemplateExist(value, templateInfo) {
  return Object.keys(templateInfo).includes(value);
}

/**
 * 生成 prompts questions
 * @param { string } template 模板名称
 * @param { boolean } shouldExist 模板是否应当存在，insert: false  update: true
 */
function generateQuestions(template, shouldExist, templateInfo) {
  const questions = [
    {
      type: "text",
      name: "template",
      message: "模板名称",
      validate: (value) =>
        shouldExist
          ? isTemplateExist(value, templateInfo)
            ? true
            : "模板不存在"
          : isTemplateExist(value, templateInfo)
          ? "模板已存在"
          : true,
    },
    {
      type: "select",
      name: "sourceType",
      message: "模板来源",
      choices: [
        { title: "本地模板", value: "local" },
        { title: "git-repo(GitHub, GitLab, Bitbucket)", value: "remote" },
      ],
    },
    {
      type: "text",
      name: "path",
      message: (prev, values) => {
        if (prev === "local") return "本地地址";
        if (prev === "remote") return "仓库名称";
      },
    },
    {
      type: "text",
      name: "description",
      message: "简要描述",
    },
  ];
  if (template) questions.shift();
  return questions;
}

/**
 * 缓存模板
 * @param { string } name 模板名称
 * @param { string } type 资源类型 'local' | 'remote'
 * @param { string } path 资源地址
 */
async function cacheTemplate(name, type, path, description, replace) {
  const targetTemplatePath = getPackagePath("tpl/", name); // 缓存模板路径
  const targetPackagePath = getPackagePath("tpl/", name, "./package.json"); // 缓存模板下 package 文件路径
  const spinner = ora(chalk.grey("Loading..."));
  spinner.start();

  if (replace) {
    await fse.remove(targetTemplatePath).catch((error) => {
      console.log("======== 删除当前模板失败 ========");
      console.log(error);
      console.log("==================================");
      process.exit(1);
    });
  }

  // 复制本地模板至缓存路径
  if (type === "local") {
    /**
     * NOTE:
     * 根据 .gitignore 过滤
     * 若无 .gitignore 则 默认过滤 .git 与 node_modules
     */
    const sourceTemplatePath = getProcessPath(path);
    const allowFiles = (
      await walk({
        path: sourceTemplatePath,
        ignoreFiles: [".gitignore"],
        includeEmpty: true,
      }).catch((error) => {
        console.log("======== 查询当前模板失败 ========");
        console.log(error);
        console.log("==================================");
        spinner.stop();
        process.exit(1);
      })
    ).filter((file) => !/(\.git|node_modules)\/.+/.test(file));
    allowFiles.forEach(async (file) => {
      const sourceFile = resolve(sourceTemplatePath, file);
      const targetFile = resolve(targetTemplatePath, file);
      await fse.copy(sourceFile, targetFile).catch((error) => {
        console.log("======== 复制当前模板失败 ========");
        console.log(error);
        console.log("==================================");
        spinner.stop();
        process.exit(1);
      });
    });
    spinner.stop();
  }

  // 下载远端模板至缓存路径
  if (type === "remote") {
    await new Promise((resolve, reject) => {
      download(path, targetTemplatePath, (err) =>
        err ? reject(err) : resolve()
      );
    }).finally(() => spinner.stop());
  }

  console.log(chalk.grey("缓存模板信息成功"));

  const hasPackage = await fse.exists(targetPackagePath);
  const packageInfo = hasPackage
    ? fse.readJSONSync(targetPackagePath)
    : undefined;
  const templateInfo = {
    version: (packageInfo && packageInfo.version) || "1.0.0",
    path: targetTemplatePath,
    description:
      description || (packageInfo && packageInfo.description) || "暂无描述",
    sourceType: getSourceTypeLabel(type),
    updated: new Date(),
  };
  if (!replace) templateInfo.created = templateInfo.updated;

  // 更新 template.json 信息
  await setTemplateInfo(name, templateInfo);

  console.log(chalk.green("Finished!!!"));
}

/**
 * @typedef { object } InsertArguments
 * @prop { string= } template 模板名称
 *
 * 添加模板
 * @param { InsertArguments } args 参数
 * @param { object | null } opts 选项，目前为 null
 * @param { boolean } shouldExist 模板是否应当存在，insert: false  update: true
 */
async function insert(args, opts, shouldExist) {
  const templateInfo = await getTemplateInfo();
  if (args.template) {
    if (!shouldExist && isTemplateExist(args.template, templateInfo))
      return console.log(chalk.red("模板已存在"));
    if (shouldExist && !isTemplateExist(args.template, templateInfo))
      return console.log(chalk.red("模板不存在"));
  }
  const questions = generateQuestions(args.template, shouldExist, templateInfo);
  const result = await prompts(questions);
  const { template = args.template, sourceType, path, description } = result;
  const replace = shouldExist;
  await cacheTemplate(template, sourceType, path, description, replace);
}

module.exports = insert;
