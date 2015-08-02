() => {
    const githubInjection = require('github-injection');
    const $ = require('jquery');
    const rubygems = require('./rubygems');
    const github = require('./github');

    const main = () => {
        checkValidLocation()
            .then(() => {})
            .catch((err) => { if (err) { console.log(err) } });
    };

    const checkValidLocation = () => {
        return new Promise((resolve, reject) => {
            if ( ! new RegExp("/commit/").test(location.href) ) {
                reject();
                return;
            }
            let promises = [];
            github.extractFilenames().each((i, file) => {
                switch ( file ) {
                    case "Gemfile.lock":
                        promises.push(handleGemfile());
                        break;
                }
            });

            Promise.all(promises).then(resolve, reject);
        });
    };

    const handleGemfile = () => {
        return new Promise((resolve, reject) => {
            let file = github.getFileDOM('Gemfile.lock');
            let changedLines = github.extractChangeLines(file);
            let changedLibraries = $(changedLines).map((i, line) => {
                let result = {
                    line: line,
                    deletionDOM: rubygems.parseLibrary(line.deletionDOM.text()),
                    additionDOM: rubygems.parseLibrary(line.additionDOM.text()),
                };
                if ( result.deletionDOM && result.additionDOM && result.deletionDOM.name === result.additionDOM.name ) {
                    result.name = result.deletionDOM.name;
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
                            let diffUrl = github.getDiffURL(githubUrl, lib.deletionDOM.version, lib.additionDOM.version);
                            rewriteDOM(lib.line.additionDOM, diffUrl);
                            rewriteDOM(lib.line.deletionDOM, diffUrl);
                        }
                    }
                });
                resolve();
            }).catch(reject);
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

    githubInjection(window, (err) => {
        if ( err ) { throw err };

        main();
    });
}();
