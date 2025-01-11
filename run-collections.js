#!/usr/bin/env node
// File uses newman package from global.
// How to execute?:  NODE_PATH=$(npm root -g) node run-collections-in-directory.js -e ./environments/LOCAL.postman_environment.json
fs = require('fs');
newman = require('newman');

var argv = require('minimist')(process.argv.slice(2));
var folder = argv.f || './collections';
var env = argv.e || './environments/dev.json';
var help = argv.h || false;

if (help) {
    console.info(
        'Options are \n 1. -f to specify the folder that contains postman collection json \n 2. -e to specify the environment json',
    );
    return;
}

fs.readdir(folder, function (err, files) {
    if (err) {
        throw err;
    }

    // we filter all files with JSON file extension
    files = files.filter(function (file) {
        return /^((?!(package(-lock)?))|.+)\.json/.test(file);
    });

    // now we iterate on each file name and call newman.run using each file name
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        newman
            .run(
                {
                    collection: require(`${folder}/${file}`),
                    environment: require(`${__dirname}/${env}`),
                    reporters: ['cli','json']
                }
                err => {
                    if (err) {
                        //Let GA know of the failure. Can comment the two lines below to run it locally.
                        const core = require('@actions/core');
                        core.setFailed('Newman run failed! ' + (err || ''));
                        // End of GA specific code.
                        console.info(`${file}: failed! ` + (err || ''));
                    }
                },
            )
            .on('done', (err, summary) => {
                if (err || summary.run.failures.length) {
                    //Let GA know of the failure. Can comment the two lines below to run it locally.
                    const core = require('@actions/core');
                    core.setFailed('Newman run failed! ' + (err || ''));
                    // End of GA specific code.
                    console.info(`${file}: failed!` + (err || ''));
                } else {
                    console.info(`${file}: passed!`);
                }
            });
    }
});