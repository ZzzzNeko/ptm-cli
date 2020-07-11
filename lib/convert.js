const path = require('path')
const { version } = require('commander')
const { time } = require('console')

/**
 * 获取基于当前包目录下的路径
 * @param  {...string} args 子路径
 */
const getPackagePath = (...args) => path.resolve(__dirname, '../', ...args)

/**
 * 获取基于当前进程目录下的路径
 * @param  {...string} args 子路径
 */
const getProcessPath = (...args) => path.resolve(process.cwd(), ...args)

/**
 * 格式化版本号，统一输出为 x.x.x
 * @param { string } version 版本号
 */
const formatVersion = version => version.trim().replace(/^[@v]/, '')

const formatTime = time => {
  const pad = val => val >= 10 ? String(val) : '0' + val
  const date = new Date(time)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const days = date.getDay()
  const hours = date.getHours()
  const mins = date.getMinutes()
  const secs = date.getSeconds()
  return `${[year, month, days].map(pad).join('-')} ${[hours, mins, secs].map(pad).join(':')}`
}

module.exports = {
  getPackagePath,
  getProcessPath,
  formatVersion,
  formatTime
}