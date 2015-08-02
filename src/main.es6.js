() => {
    const githubInjection = require('github-injection');
    const $ = require('jquery');
    const github = require('./github');
    const rubygems = require('./rubygems');
    const npm = require('./npm');

    const main = () => {
        checkValidLocation()
            .then(() => {})
            .catch((err) => { if (err) { console.log(err) } });
    };

    const checkValidLocation = () => {
        return new Promise((resolve, reject) => {
            if ( ! new RegExp("/(commit|compare)/").test(location.href) ) {
                reject();
                return;
            }
            let promises = [];
            github.extractFilenames().each((i, file) => {
                switch ( file ) {
                    case "Gemfile.lock":
                        promises.push(handleGemfile());
                        break;
                    case "package.json":
                        promises.push(handlePackageJson());
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
                    deletion: rubygems.parseLibrary(line.deletionDOM.text()),
                    addition: rubygems.parseLibrary(line.additionDOM.text()),
                };
                if ( result.deletion && result.addition && result.deletion.name === result.addition.name ) {
                    result.name = result.deletion.name;
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
                let responseOf = {};
                $(result).each((i, res) => {
                    responseOf[res.name] = res;
                });

                changedLibraries.each((i, lib) => {
                    if ( lib === null ) {
                        return;
                    }
                    if ( responseOf[lib.name] ) {
                        let githubUrl = rubygems.getGithubUrl(responseOf[lib.name]);
                        if ( githubUrl ) {
                            let diffUrl = github.getDiffURL(githubUrl, lib.deletion.version, lib.addition.version);
                            rewriteDOM(lib.line.additionDOM, diffUrl);
                            rewriteDOM(lib.line.deletionDOM, diffUrl);
                        }
                    }
                });
                resolve();
            }).catch(reject);
        });
    };

    const handlePackageJson = function() {
        return new Promise((resolve, reject) => {
            let file = github.getFileDOM('package.json');
            let changedLines = github.extractChangeLines(file);
            let changedLibraries = $(changedLines).map((i, line) => {
                let result = {
                    line: line,
                    deletion: npm.parseLibrary(line.deletionDOM.text()),
                    addition: npm.parseLibrary(line.additionDOM.text()),
                };
                if ( result.deletion && result.addition && result.deletion.name === result.addition.name ) {
                    result.name = result.deletion.name;
                    return result;
                } else {
                    return null;
                }
            });
            $(changedLibraries).each((i, library) => {
                if ( library === null ) {
                    return;
                }
                let githubUrl = npm.getGithubUrl(library.name);
                if ( githubUrl ) {
                    let diffUrl = github.getDiffURL(githubUrl, library.deletion.version, library.addition.version);
                    rewriteDOM(library.line.additionDOM, diffUrl);
                    rewriteDOM(library.line.deletionDOM, diffUrl);
                }
            });
            resolve();
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
