const inquirer = require('inquirer');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

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
            message: 'Please choose project dev: ',
            choices: choiceList,
        },
    ]);
    return answers.type;
}

async function promptChooseEnvironment() {
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
            message: 'Please choose env start: ',
            choices: choiceList,
        },
    ]);
    return answers.type;
}

(async () => {
    try {
        let {project, service} = argv;
        if (!project) {
            project = await promptChooseEnvironment();
        }

        if (!service) {
            service = await promptChooseService();
        }

        const command = `NODE_PATH=./ NODE_ENV=development NODE_PROJECT=${project} pm2-dev start ${process.cwd()}/pm2/${service}.json`;
        console.info(command);
    } catch (e) {
        console.error(e);
    }
})();
