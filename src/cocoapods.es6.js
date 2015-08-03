
const $ = require('jquery');
const github = require('./github');

module.exports = {
    parseLibrary(line) {
         let regexp = /\s*(\S+)\s*\([-~>= ]*([\d\.]+)\)/
         let result = line.match(regexp);
         if ( ! result ) {
             return;
         }
         return {
             name: result[1],
             version: result[2]
         };
    },
    requestApi(name) {
        return new Promise((resolve, reject) => {
            return $.ajax('https://search.cocoapods.org/api/v1/pods.flat.hash.json?query=name:' + encodeURIComponent(name)).done((records) => {
                for ( let i = 0; i < records.length; ++i ) {
                    if ( records[i].id == name ) {
                        resolve(records[i]);
                        return;
                    }
                }
                resolve(null);
            }).fail(reject);
        });
    },
    getGithubUrl(res) {
        return res.source.git.replace('.git', '');
    }

};
