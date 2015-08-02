() => {
    const githubInjection = require('github-injection');
    const $ = require('jquery');
    const rubygems = require('./rubygems');
    const github = require('./github');

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
                line: line,
                deleted_code: rubygems.parseLibrary(line.deleted_code.text()),
                added_code: rubygems.parseLibrary(line.added_code.text()),
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
            promises.push(rubygems.requestApi(library.name));
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
                    let githubUrl = rubygems.getGithubUrl(libraryOf[lib.name]);
                    if ( githubUrl ) {
                        let diffUrl = github.getDiffURL(githubUrl, lib.deleted_code.version, lib.added_code.version);
                        rewriteDOM(lib.line.added_code, diffUrl);
                        rewriteDOM(lib.line.deleted_code, diffUrl);
                    }
                }
            });
        });
    };

    const rewriteDOM = function(element, diffUrl) {
        element.data('diff-url', diffUrl);
        element.css('cursor', 'pointer');
        element.click((e) => {
            let target = $(e.currentTarget);
            if ( target.data('diff-url') ) {
                window.open(target.data('diff-url'));
            }
        });
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
