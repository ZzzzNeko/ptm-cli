const fse = require('fs-extra')
const prompts = require('prompts')
const chalk = require('chalk')
const execa = require('execa')
const listr = require('listr')
const { getPackagePath, getProcessPath } = require('../lib/convert')
const { getTemplateInfo } = require('../lib/template')

async function generateQuestions(name, path) {
  const templates = await getTemplateInfo()
  const questions = [
    { 
      type: 'text', 
      name: 'projectName', 
      message: '项目名称' 
    },
    { 
      type: 'text', 
      name: 'projectPath', 
      message: '项目地址' 
    },
    {
      type: 'select',
      name: 'templateName',
      message: '模板名称',
      choices: Object.keys(templates).map(item => ({ title: item, value: item }))
    },
    { 
      type: 'select', 
      name: 'pkgManager', 
      message: '包管理器', 
      choices: [
        { title: 'npm', value: 'npm' },
        { title: 'yarn', value: 'yarn' }
      ] 
    }
  ]
  if(name) questions.shift()
  if(path) questions.shift()
  return questions
}

/**
 * 创建项目
 * @param { string } sourcePath 模板地址
 * @param { string } targetPath 项目地址
 * @param { string } pkgManager 包管理器
 */
async function createProject (sourcePath, targetPath, pkgManager) {
  await fse.copy(sourcePath, targetPath)
  console.log(chalk.grey('模板创建成功'))
  const tasks = new listr([
    {
      title: '依赖安装',
      task: () => execa(pkgManager, ['install'], { cwd: targetPath })
    }
  ])
  await tasks.run()
    .catch(err =>{
      console.error(err)
    })
  console.log(chalk.green('Finish!!!'))
}

/**
 * 创建项目
 * @param { object } args { projectName?, projectPath? }
 * @param { object | null } opts 暂时为 null
 */
async function create(args, opts) {
  const questions = await generateQuestions(args.projectName, args.projectPath)
  const result = await prompts(questions)
  const { projectName, projectPath, templateName, pkgManager } = result
  const sourcePath = getPackagePath(`tpl/${templateName}`)
  const targetPath = getProcessPath(projectPath, projectName)
  await createProject(sourcePath, targetPath, pkgManager)
}

module.exports = create
