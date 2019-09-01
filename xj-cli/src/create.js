const axios = require('axios');
// create项目
// 拉去所有项目列表 让用户选 安装那个项目
// 选完后 在显示所有的版本号1.0
// https://api.github.com/orgs/zhu-cli/repos获取组织下的仓库

// 1) 获取项目列表
const fetchRepoList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/zhu-cli/repos');
  return data;
};
module.exports = async (projectName) => {
  // 1) 获取项目所有的模板
  const repos = await fetchRepoList();
  console.log(repos);
};
