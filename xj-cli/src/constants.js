// 存放需要的常量
const { version } = require('../package.json');

// 存储模板的目录
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`;
module.exports = {
  version,
  downloadDirectory,
};
