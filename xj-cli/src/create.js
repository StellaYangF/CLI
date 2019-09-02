const axios = require('axios');
const Inquirer = require('inquirer'); // 类
const ora = require('ora');
// create项目
// 拉去所有项目列表 让用户选 安装那个项目
// 选完后 再显示所有的版本号1.0
// https://api.github.com/orgs/zhu-cli/repos获取组织下的仓库
// 还可配置组织
// 可能还需要用户配置一些数据 来结合渲染项目(模板渲染)

// 工具函数
// 1) 获取项目列表
const fetchRepoList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/zhu-cli/repos');
  return data;
};


module.exports = async (projectName) => {
  // 1) 获取项目所有的模板
  const spinner = ora('fetcing template...');
  spinner.start();
  let repos = await fetchRepoList();
  spinner.succeed();
  repos = repos.map((item) => item.name);
  // 在获取之前 显示loading 关闭loadIG
  // 选择模板 inquirer

  const { repo } = await Inquirer.prompt({
    name: 'repo',
    type: 'list', // checkbox radios
    message: 'Please choose a template to create project',
    choices: repos,
  }); // 返回promise
  console.log(repo);
};
