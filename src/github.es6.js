module.exports = {
    isUrl(url) {
        return new RegExp("https?://github.com/").test(url);
    }
};
