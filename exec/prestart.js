const {execSync} = require('child_process');
const readline = require('readline');

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        })
    );
}

(async () => {
    try {
        const pw = await askQuestion('Type password unzip config: ');

        execSync(`unzip -o -P ${pw} config.zip`);

        execSync('yarn install');
    } catch (e) {
        console.error(e);
    }
})();
