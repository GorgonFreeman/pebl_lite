const chokidar = require('chokidar');
const { exec } = require('child_process');

const scriptsToRun = [
  'node _node_scripts/generateServable.js',
];

const watcher = chokidar.watch('./', {
  ignored: [
    /node_modules/, 
    /.git/,
    /_node_scripts/,
    /servable\.js/,
  ],
  persistent: true,
});

let running = false;
watcher
  .on('ready', () => {
    console.log('File watcher running. o7');
    running = true;
  })
  .on('add', (path) => {
    if (!running) {
      return;
    }
    console.log(`File ${ path } has been added`);
    runScripts(path);
  })
  .on('change', (path) => {
    if (!running) {
      return;
    }
    console.log(`File ${ path } has been changed`);
    runScripts(path);
  });

const runScripts = (path) => {

  const moreScriptsToRun = [];

  const command = `conc ${ [ ...scriptsToRun, ...moreScriptsToRun ].map(script => `"${ script }"`).join(' ') }`;
  console.log(command);
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error executing scripts: ${ stderr }`);
    } else {
      console.log(`Scripts output: ${ stdout }`);
    }
  });
};