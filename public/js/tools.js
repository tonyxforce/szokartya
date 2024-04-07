"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCookie = exports.setCookie = exports.httpJsonPost = exports.httpJsonGet = exports.httpGet = void 0;
function httpGet(theUrl, obj) {
    var xmlHttp = new XMLHttpRequest();
    var url = theUrl + (obj ? "?" + serialize(obj) : "");
    xmlHttp.open("GET", url, false); // false for synchronous request
    xmlHttp.send(null);
    console.log(url, xmlHttp.responseText);
    return xmlHttp.responseText;
}
exports.httpGet = httpGet;
function httpJsonGet(url, obj) {
    return JSON.parse(httpGet(url, obj));
}
exports.httpJsonGet = httpJsonGet;
function httpJsonPost(url, body) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(body));
    return JSON.parse(xhr.responseText);
}
exports.httpJsonPost = httpJsonPost;
function setCookie(cname, cvalue, exdays = 1000) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
exports.setCookie = setCookie;
function getCookie(cname) {
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
exports.getCookie = getCookie;
function serialize(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}
