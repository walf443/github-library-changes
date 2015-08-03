const $ = require('jquery');
module.exports = {
    isUrl(url) {
        return new RegExp("https?://github.com/").test(url);
    },
    getDiffURL(baseURL, beforeVersion, afterVersion) {
      return new Promise((resolve, reject) => {
        $.ajax({
            type: 'HEAD',
            async: true,
            url: baseURL + '/releases/tag/' + 'v' + beforeVersion
        }).done((res) => {
            let url = baseURL + '/compare/' + 'v' + beforeVersion + '...' + 'v' + afterVersion + '#files_bucket';
            resolve(url);
        }).fail((err) => {
            $.ajax({
                type: 'HEAD',
                async: true,
                url: baseURL + '/releases/tag/' + beforeVersion
            }).done((res) => {
                let url = baseURL + '/compare/' + beforeVersion + '...' + afterVersion + '#files_bucket';
                resolve(url);
            }).fail((err) => {
                reject(err);
            });
        });
      });
    },
    getFileDOM(filename) {
        let result;
        $('#files .file').each((i, file) => {
            let target = $('.file-header[data-path=" + filename + "]', file);
            if ( target ) {
                result = file;
            }
        });
        return result;
    },
    extractFilenames() {
        return $('.file-header[data-path]').map((i, e) => $(e).data('path'));
    },
    extractChangeLines(fileDOM) {
        let result = []
        $('.diff-table tr', fileDOM).each((i, line) => {
            let deletionDOM = $('.blob-code.blob-code-deletion', line);
            let additionDOM = $('.blob-code.blob-code-addition', line);
            if ( deletionDOM[0] && additionDOM[0] ) {
                result.push({ additionDOM: additionDOM, deletionDOM: deletionDOM });
            }
        });
        return result;
    }
};
