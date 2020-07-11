const fse = require('fs-extra')
const chalk = require('chalk')
const { formatTime } = require('../lib/convert')
const { forEachObject } = require('../lib/common')
const { getTemplateInfo } = require('../lib/template')

function generateTemplateList (templates) {
  const tableData = []
  forEachObject(templates, (key, val, obj) => {
    const template = {
      "模板名称": key,
      "简要描述": val.description || '暂无描述'
    }
    tableData.push(template)
  })
  return tableData
}

function generateTemplateInfo (template) {
  return chalk.cyan(`
    当前版本: ${template.version}
    模板来源: ${template.sourceType}
    模板路径: ${template.path}
    简要描述: ${template.description}
    创建时间: ${formatTime(template.created)}
    更新时间: ${formatTime(template.updated)}
  `)
}

async function select(args, opts) {
  const templates = await getTemplateInfo()
  if(args.template && args.template != '*') {
    if(!Object.keys(templates).includes(args.template))
      return console.log(chalk.red('暂无该模板'))
    const logInfo = generateTemplateInfo(templates[args.template])
    console.log(logInfo)
  }else {
    const logInfo = generateTemplateList(templates)
    logInfo.length > 0 
      ? console.table(logInfo)
      : console.warn(chalk.red('暂无模板信息'))
  }
}

module.exports = select
