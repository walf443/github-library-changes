// search.cocoapods.org reject seems to block request that has Referer header. So spoofing Referer header.
chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
    let isExistReferer = false;
    for (let i = 0; i < details.requestHeaders.length; ++i) {
        if ( details.requestHeaders[i].name === 'Referer' ) {
            isExistReferer = true;
            details.requestHeaders[i].value = 'https://search.cocoapods.org/';
            break;
        }
    }
    if ( !isExistReferer ) {
        details.requestHeaders.push({
            name: 'Referer',
            value: 'https://search.cocoapods.org/'
        });
    }
    return { requestHeaders: details.requestHeaders };
}, { urls: ['https://search.cocoapods.org/*'] }, ['blocking', 'requestHeaders']);
