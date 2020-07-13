const ora = require('ora')
const fse = require('fs-extra')
const chalk = require('chalk')
const prompts = require('prompts')
const download = require('download-git-repo')
const templates = require('../tpl/template.json')
const { getPackagePath, getProcessPath } = require('../lib/convert')
const { setTemplateInfo } = require('../lib/template')
const { resolve } = require('path')
const walk = require('ignore-walk')

function getSourceTypeLabel (type) {
  if(type === 'local') return '本地模板'
  if(type === 'remote') return '远端模板'
}

function isTemplateExist (value) {
  return Object.keys(templates).includes(value)
}

/**
 * 生成 prompts questions
 * @param { string } template 模板名称
 * @param { boolean } shouldExist 模板是否应当存在，insert: false  update: true
 */
function generateQuestions (template, shouldExist) {
  const questions = [
    {
      type: 'text',
      name: 'template',
      message: '模板名称',
      validate: value => shouldExist 
        ? isTemplateExist(value) 
          ? true
          : '模板不存在'
        : isTemplateExist(value) 
          ? '模板已存在'
          : true
    },
    {
      type: 'select',
      name: 'sourceType',
      message: '模板来源',
      choices: [
        { title: '本地模板', value: 'local' },
        { title: 'git-repo(GitHub, GitLab, Bitbucket)', value: 'remote' }
      ]
    },
    {
      type: 'text',
      name: 'path',
      message: (prev, values) => {
        if(prev === 'local')  return '本地地址'
        if(prev === 'remote') return '仓库名称'
      }
    },
    {
      type: 'text',
      name: 'description',
      message: '简要描述'
    }
  ]
  if(template) questions.shift()
  return questions
}

/**
 * 缓存模板
 * @param { string } name 模板名称
 * @param { string } type 资源类型 'local' | 'remote'
 * @param { string } path 资源地址
 */
async function cacheTemplate (name, type, path, description, replace) {
  const cacheTemplatePath = getPackagePath('tpl/', name)    // 缓存模板路径
  const cachePackagePath = getPackagePath('tpl/', name, './package.json') // 缓存模板下 package 文件路径
  const spinner = ora(chalk.grey('Loading...'))
  spinner.start()

  if(replace) {
    await fse.remove(cacheTemplatePath)
      .catch(error => {
        console.log('======== 删除当前模板失败 ========')
        console.log(error)
        console.log('==================================')
        process.exit(1)
      })
  }

  // 复制本地模板至缓存路径
  if(type === 'local') {
    // 根据 .gitignore 过滤
    // TODO: 1. 判断 .gitignore 是否存在 2. 固定忽略 .git
    const tplPath = getPackagePath(path)
    const allowFiles = walk.sync({
      path: getPackagePath(tplPath),
      ignoreFiles: ['.gitignore'],
      includeEmpty: true,
    })
    allowFiles.forEach(async file => {
      const sourceFile = resolve(tplPath, file)
      const targetFile = resolve(cacheTemplatePath, file)
      await fse.copy(sourceFile, targetFile)
    })
    spinner.stop()
  }

  // 下载远端模板至缓存路径
  if(type === 'remote') {
    await new Promise((resolve, reject) => {
      download(path, cacheTemplatePath, err => err ? reject(err) : resolve())
    })
    .finally(() => spinner.stop())
  }

  console.log(chalk.grey('缓存模板信息成功'))

  const hasPackage = await fse.exists(cachePackagePath)
  const packageInfo = hasPackage 
    ? fse.readJSONSync(cachePackagePath)
    : undefined
  const templateInfo = {
    version: packageInfo && packageInfo.version || '1.0.0',
    path: cacheTemplatePath,
    description: description || packageInfo && packageInfo.description || '暂无描述',
    sourceType: getSourceTypeLabel(type),
    updated: new Date
  }
  if(!replace) templateInfo.created = templateInfo.updated

  // 更新 template.json 信息
  await setTemplateInfo(name, templateInfo)

  console.log(chalk.green('Finished!!!'))
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
async function insert (args, opts, shouldExist) {
  if(args.template) {
    if(!shouldExist && isTemplateExist(args.template))
      return console.log(chalk.red('模板已存在'))
    if(shouldExist && !isTemplateExist(args.template))
      return console.log(chalk.red('模板不存在'))      
  } 
  const questions = generateQuestions(args.template, shouldExist)
  const result = await prompts(questions)
  const { template = args.template, sourceType, path, description } = result
  const replace = shouldExist
  await cacheTemplate(template, sourceType, path, description, replace)
}

module.exports = insert