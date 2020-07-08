const fse = require('fs-extra')
const prompts = require('prompts')
const { getPackagePath } = require('../lib/convert')
const { getTemplateInfo, writeTemplates } = require('../lib/template')
const chalk = require('chalk')

function isTemplateExist (templates, name,) {
  return Object.keys(templates).includes(name)
}

/**
 * 生成 prompts questions
 * @param { string } oldName 旧的名称
 * @param { string } newName 新的名称
 * @param { object } templates 模板信息
 */
function generateQuestions(oldName, newName, templates) {
  const questions = [
    {
      type: 'text',
      name: 'oldName',
      message: '需要改名的模板',
      validate: value => isTemplateExist(templates, value, ) ? true : '模板不存在'
    },
    {
      type: 'text',
      name: 'newName',
      message: '修改后模板名称',
      validate: value => isTemplateExist(templates, value, ) ? '模板已存在' : true
    }
  ]
  if(oldName) questions.shift()
  if(newName) questions.shift()
  return questions
}

/**
 * 重命名模板名称
 * @param { string } oldName 旧的模板名称
 * @param { string } newName 新的模板名称
 */
async function renameTemplate(oldName, newName) {
  const oldPath = getPackagePath(`tpl/${oldName}`)
  const newPath = getPackagePath(`tpl/${newName}`)
  await fse.rename(oldPath, newPath)
    .catch(error => {
      console.log('======== 模板重命名失败 ========')
      console.log(error)
      console.log('================================')
      process.exit(1)
    })
  console.log(chalk.grey('模板名称修改成功'))
  const templates = await getTemplateInfo()
  templates[newName] = templates[oldName]
  delete templates[oldName]
  await writeTemplates(templates)
  console.log(chalk.green('Finish!!!'))
}

/**
 * 修改模板名称
 * @param { object } args { oldName?, newName }
 * @param { object | null} opts 暂时为 null
 */
async function rename(args, opts) {
  const templates = await getTemplateInfo()
  if(args.oldName && !isTemplateExist(templates, args.oldName))
    return console.log(chalk.red('模板不存在'))
  if(args.newName && isTemplateExist(templates, args.newName))
    return console.log(chalk.red('模板已存在'))

  const questions = generateQuestions(args.oldName, args.newName, templates)
  const result = questions.length > 0 ? await prompts(questions) : {}
  const { oldName = args.oldName, newName = args.newName } = result
  await renameTemplate(oldName, newName)
}

module.exports = rename
