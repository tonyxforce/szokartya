function httpGet(theUrl: string, obj?: object) {
    var xmlHttp = new XMLHttpRequest();
    var url = theUrl + (obj ? "?" + serialize(obj) : "");
    xmlHttp.open("GET", url, false); // false for synchronous request
    xmlHttp.send(null);
    console.log(url, xmlHttp.responseText)
    return xmlHttp.responseText;
}
function httpJsonGet(url: string, obj?: object) {
    return JSON.parse(httpGet(url, obj));
}

function httpJsonPost(url: string, body: object) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(body));
    return JSON.parse(xhr.responseText);
}

function setCookie(cname: string, cvalue: number, exdays = 1000) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname: string) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function serialize(obj: object) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}