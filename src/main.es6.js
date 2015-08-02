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
            github.extractFilenames().each((i, file) => {
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
        let file = github.getFileDOM('Gemfile.lock');
        let changedLines = github.extractChangeLines(file);
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
