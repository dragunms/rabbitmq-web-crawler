const {execSync} = require('child_process');
const inquirer = require('inquirer');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

async function promptChooseEnv() {
    const choiceList = ['development', 'production'];

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'type',
            message: 'Please choose env start: ',
            choices: choiceList,
        },
    ]);
    return answers.type;
}

async function promptChooseProject() {
    const choiceList = [];

    const configPath = `${process.cwd()}/config`;

    const dirs = fs.readdirSync(configPath);

    dirs.forEach((dirName) => {
        if (fs.statSync(`${configPath}/${dirName}`).isDirectory()) {
            choiceList.push(dirName);
        }
    });

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'type',
            message: 'Please choose project start: ',
            choices: choiceList,
        },
    ]);
    return answers.type;
}

async function promptChooseService() {
    const choiceList = [];

    const files = fs.readdirSync(`${process.cwd()}/pm2`);

    files.forEach((file) => {
        if (file.includes('.json')) {
            choiceList.push(file.replace('.json', ''));
        }
    });

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'type',
            message: 'Please choose service start: ',
            choices: choiceList,
        },
    ]);
    return answers.type;
}

(async () => {
    try {
        let {env, project, service} = argv;
        if (!env) {
            env = await promptChooseEnv();
        }

        if (!project) {
            project = await promptChooseProject();
        }

        if (!service) {
            service = await promptChooseService();
        }

        const command = `NODE_PATH=./ NODE_ENV=${env} NODE_PROJECT=${project} pm2 start ${process.cwd()}/pm2/${service}.json`;
        console.info(`run command ${command}`);
        execSync(command);
    } catch (e) {
        console.error(e);
    }
})();
