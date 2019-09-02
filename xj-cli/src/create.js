const axios = require('axios');
const Inquirer = require('inquirer'); // 类
const ora = require('ora');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
let downloadGitRepo = require('download-git-repo');
let ncp = require('ncp');
const MetalSmith = require('metalsmith'); // 遍历文件夹 找需要不需要渲染
// 统一所有的模板引擎
let { render } = require('consolidate').ejs;
const { downloadDirectory } = require('./constants');

render = promisify(render);
downloadGitRepo = promisify(downloadGitRepo);
ncp = promisify(ncp);
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

// 2) 抓取tag列表
const fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/zhu-cli/${repo}/tags`);
  return data;
};

// 3) 封装loading效果
const waitFnloading = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start();
  const result = await fn(...args);
  spinner.succeed();
  return result;
};

// 4) 封装download
const download = async (repo, tag) => {
  let api = `zhu-cli/${repo}`;
  if (tag) {
    api += `#${tag}`;
  }
  //  /user/xxxx/.template/repo
  const dest = `${downloadDirectory}/${repo}`;
  await downloadGitRepo(api, dest);
  return dest; // 下载的目录
};

module.exports = async (projectName) => {
  // 1) 获取项目所有的模板
  let repos = await waitFnloading(fetchRepoList, 'fetcing template...')();
  repos = repos.map((item) => item.name);
  // 在获取之前 显示loading 关闭loading

  const { repo } = await Inquirer.prompt({
    name: 'repo',
    type: 'list', // checkbox radios
    message: 'Please choose a template to create project',
    choices: repos,
  }); // 返回promise

  // 2)通过当前选择的项目 拉去对应的版本 inquirer
  let tags = await waitFnloading(fetchTagList, 'fetcing tags...')(repo);
  tags = tags.map((item) => item.name);

  const { tag } = await Inquirer.prompt({
    name: 'tag',
    type: 'list', // checkbox radios
    message: 'Please choose a tag to create project',
    choices: tags,
  });
  console.log(repo, tag); // 下载模板
  // 3)把模板放到一个临时目录里 存放，以备后期使用

  // download-git-repo
  const result = await waitFnloading(download, 'downloading...')(repo, tag);
  console.log(result);

  // 拿到下载的目录，直接拷贝到当前执行的目录下即可 ncp

  // 把template 下的文件 拷贝到执行命令的目录下
  // 4) 拷贝文件

  // 如果有ask.js文件  //.template/ask.js
  if (!fs.existsSync(path.join(result, 'ask.js'))) {
    await ncp(result, path.resolve(projectName));
  } else {
    // 复杂的需要模板渲染 渲染后再拷贝
    // 把git项目下载下来，如果有ask 文件就是一个复杂的模板 我们需要用户选择 选择后编译

    // 1)让用户提案信息
    await new Promise((resolve, reject) => {
      MetalSmith(__dirname) // 传入路径 默认会遍历当前路径下的src文件
        .source(result)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          // console.log(files);
          const args = require(path.join(result, 'ask.js'));
          const obj = await Inquirer.prompt(args);
          const meta = metal.metadata();
          Object.assign(meta, obj);
          delete files['ask.js'];
          done();
        })
        .use((files, metal, done) => {
          const obj = metal.metadata();
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString();
              if (content.includes('<%')) {
                content = await render(content, obj);
                files[file].contents = Buffer.from(content);
              }
            }
          });
          // 2) 用户填写的信息去渲染模板
          done();
        })
        .build((err) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  }
};
