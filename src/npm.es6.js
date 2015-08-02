
const githubLinkerCache = require('github-linker-cache');

module.exports = {
    parseLibrary(line) {
         let regexp = /\s*"(\S+)":\s*"[\^~ ]*([\d\.]+)"/
         let result = line.match(regexp);
         if ( ! result ) {
             return;
         }
         return {
             name: result[1],
             version: result[2]
         };
    },
    getGithubUrl(packageName) {
        return githubLinkerCache.npm[packageName];
    }
};
