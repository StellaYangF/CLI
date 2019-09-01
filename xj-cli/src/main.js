//  找到 要解析执行的核心文件
// 1) 要解析用户的参数
const program = require('commander');
const { version } = require('./constants.js');
// create  project name

// command collection
const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: ['xj-cli create <prject-name>'],
  },
  config: {
    alias: 'conf',
    description: 'config a project variable',
    examples: [
      'xj-cli config set <k> <v>',
      'xj-cli config get <k>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not fount',
    examples: [],
  },
};

Reflect.ownKeys(mapActions).forEach((action) => {
  program
    .command(action)
    .alias(mapActions[action].alias)
    .description(mapActions[action].description)
    .action(() => {
      if (action === '*') {
        console.log(mapActions[action].description);
      } else {
        console.log(action);
      }
    });
});

program.on('--help', () => {
  console.log('\nExamples:');
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => console.log(example));
  });
});

// 解析用户传递过来的参数
program.version().parse(process.argv);
