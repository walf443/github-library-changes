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
    requestApi(gemName) {
        return new Promise((resolve, reject) => {
            return $.ajax('https://rubygems.org/api/v1/gems/' + gemName + '.json').then(resolve, reject);
        });
    },
    getGithubUrl(res) {
        if (res.source_code_uri && github.isUrl(res.source_code_uri)) {
            return res.source_code_uri;
        }
        if (res.homepage_uri && github.isUrl(res.homepage_uri)) {
            return res.homepage_uri;
        }
    }

};
