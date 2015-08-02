module.exports = {
    isUrl(url) {
        return new RegExp("https?://github.com/").test(url);
    },
    getDiffURL(baseURL, beforeVersion, afterVersion) {
      return baseURL + '/compare/' + 'v' + beforeVersion + '...' + 'v' + afterVersion + '#files_bucket';
    },
};
