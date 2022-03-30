const {execSync} = require('child_process');
const inquirer = require('inquirer');
const fs = require('fs');

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
            message: 'Please choose service restart: ',
            choices: choiceList,
        },
    ]);
    return answers.type;
}

(async () => {
    try {
        const service = await promptChooseService();
        const command = `pm2 reload ${process.cwd()}/pm2/${service}.json`;
        console.info(`run command ${command}`);
        execSync(command);
    } catch (e) {
        console.error(e);
    }
})();
