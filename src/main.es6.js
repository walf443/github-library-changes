() => {
    const githubInjection = require('github-injection');
    const $ = require('jquery');

    const main = () => {
        checkValidLocation()
            .then(() => extractLibraries())
            .catch((err) => { if (err) { console.log(err) } });
    };

    const checkValidLocation = () => {
        return new Promise((resolve, reject) => {
            if ( ! new RegExp("/commit/").test(location.href) ) {
                reject();
                return;
            }
            extractFiles().each((i, file) => {
                switch ( file ) {
                    case "Gemfile.lock":
                        handleGemfile();
                        break;
                }
            });
            resolve();
        });
    };

    const handleGemfile = () => {
        let file = getFile('Gemfile.lock');
        let changedLines = extractTargetLines(file);
        let changedLibraries = $(changedLines).map((i, line) => {
            let result = {
                deleted_code: extractGemName(line.deleted_code.text()),
                added_code: extractGemName(line.added_code.text()),
            };
            if ( result.deleted_code && result.added_code && result.deleted_code.name === result.added_code.name ) {
                result.name = result.deleted_code.name;
                return result;
            } else {
                return null;
            }
        });
        let promises = [];
        changedLibraries.each((i, library) => {
            if ( library === null ) {
                return;
            }
            promises.push(gemApi(library.name));
        });
        Promise.all(promises).then((result) => {
            let libraryOf = {};
            $(result).each((i, lib) => {
                libraryOf[lib.name] = lib;
            });

            changedLibraries.each((i, lib) => {
                if ( lib === null ) {
                    return;
                }
                if ( libraryOf[lib.name] ) {
                    let githubUrl = getGithubForGem(libraryOf[lib.name]);
                    if ( githubUrl ) {
                        let diffUrl = githubUrl + '/compare/' + 'v' + lib.deleted_code.version + '...' + 'v' + lib.added_code.version + '#files_bucket';
                        console.log(diffUrl);
                    }
                }
            });
        });
    };

    const extractGemName = (line) => {
         let regexp = /\s*(\S+)\s*\([-~>= ]*([\d\.]+)\)/
         let result = line.match(regexp);
         if ( ! result ) {
             return;
         }
         return {
             name: result[1],
             version: result[2]
         };
    };

    const gemApi = (gemName) => {
        return new Promise((resolve, reject) => {
            return $.ajax('https://rubygems.org/api/v1/gems/' + gemName + '.json').then(resolve, reject);
        });
    };

    const isGithubURL = (url) => {
        return new RegExp("https?://github.com/").test(url);
    };

    const getGithubForGem = (library) => {
        if (library.source_code_uri && isGithubURL(library.source_code_uri)) {
            return library.source_code_uri;
        }
        if (library.homepage_uri && isGithubURL(library.homepage_uri)) {
            return library.homepage_uri;
        }
    };

    const extractFiles = () => {
        return $('.file-header[data-path]').map((i, e) => $(e).data('path'));
    };

    const extractTargetLines = (file) => {
        let result = []
        $('.diff-table tr', file).each((i, line) => {
            let deleted_code = $('.blob-code.blob-code-deletion', line);
            let added_code = $('.blob-code.blob-code-addition', line);
            if ( deleted_code[0] && added_code[0] ) {
                result.push({ added_code: added_code, deleted_code: deleted_code });
            }
        });
        return result;
    };

    const getFile = (filename) => {
        let result;
        $('#files .file').each((i, file) => {
            let target = $('.file-header[data-path=" + file + "]', file);
            if ( target ) {
                result = file;
            }
        });
        return result;
    };

    const extractLibraries = () => {
        return new Promise((resolve, reject) => {
            resolve();
        });
    };

    githubInjection(window, (err) => {
        if ( err ) { throw err };

        main();
    });
}();
