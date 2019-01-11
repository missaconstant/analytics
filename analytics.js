var loadTime;
var watchTime = new Date();
var infosFiles = [];
var visitId;
var allEls = document.querySelectorAll('*');
var server = 'http://192.168.8.106:4000/pk-admin';

/* calls part */

document.addEventListener('DOMContentLoaded', function () {
    allEls.forEach(function (el) {
        /* load event */
        if ((el.src || el.href) && el.nodeName != 'A') {
            el.addEventListener('load', function () {
                infosFiles.push({element: this.nodeName, path: this.src || this.href, loadingTime: new Date() - watchTime});
            });
        }
        /* click event */
        el.addEventListener('click', function (e) {
            if (e.target.textContent.length || e.target.src || e.target.href) {
                sendClickEvent(e);
            }
        });
        /* filled form field event */
        el.addEventListener('blur', function (e) {
            if (e.target.value && e.target.value.trim().length) {
                sendFilledFieldEvent(e);
            }
        });
    });
});

window.addEventListener('load', function () {
    loadTime = new Date() - watchTime;
    sendVisitorsInfos(watchTime.getTime(), visitId);
	sendVisitorDatas(loadTime, infosFiles);
});

document.addEventListener('DOMContentLoaded', function () {
    visitId = updateCreditentials(watchTime.getTime());
});

/* actions handling part */

function sendVisitorDatas(loadtime, infosfiles) {
    var q = new _ajax();
    q.post({
		url: server + '/api/v1/visits/add',
		datas: {loadtime: loadtime, watchingtime: watchTime.getTime(), readingpage: window.location, files: JSON.stringify(infosfiles), visitid: visitId},
        callback: function (response) { }, fail: function (err) { console.log(err) }
    });
}

function sendVisitorsInfos(watchtime, visitid) {
    var q = new _ajax();
    q.get({
        url: 'http://analytics.constantmissa.ci/pk-admin/api/get-asker-info',
        callback: function (response) {
            var values = JSON.parse(response);
            var q = new _ajax();
            q.post({
                url: server + '/api/v1/visitors/add',
                datas: {watchingtime: watchtime, remote: values.query, country: values.country, city: values.city, allinfos: response, visitid: visitid, readingpage: window.location},
                callback: function (response) { }, fail: function (err) { console.log(err) }
            });
        },
        fail: function (err) {
            console.log(err);
        }
    });
}

function sendClickEvent(evt) {
    var q = new _ajax();
    q.post({
        url: server + '/api/v1/clicks/add',
        datas: {element: evt.target.nodeName, link: evt.target.href||evt.target.src||null, domid: evt.target.id, domclass: evt.target.className, readingpage: window.location, pagewatchingtime: watchTime.getTime(), clicktime: new Date().getTime(), visitid: visitId},
        callback: function (response) { }, fail: function (err) { console.log(err) }
    });
}

function sendFilledFieldEvent(evt) {
    var q = new _ajax();
    q.post({
        url: server + '/api/v1/filled/add',
        datas: {element: evt.target.nodeName, fieldname: evt.target.name, value: evt.target.value, domid: evt.target.id, domclass: evt.target.className, readingpage: window.location, pagewatchingtime: watchTime.getTime(), clicktime: new Date().getTime(), visitid: visitId},
        callback: function (response) { }, fail: function (err) { console.log(err) }
    });
}

function updateCreditentials(visittime) {
    if (document.cookie) {
        if (c = checkCreditentials("visit")) {
            var old = new Date();
                old.setTime(parseInt(c));
            if ((new Date() - old) > (24*60*60*1000)) {
                setCookie(1, 'visit', visittime);
                return visittime;
            }
            else {
                return c;
            }
        }
        else {
            setCookie(1, 'visit', visittime);
            return visittime;
        }
    }
    else {
        return visittime;
    }
}

function checkCreditentials(name) {
    var cookie = decodeURIComponent(document.cookie).split(';');
    
    for (var i=0; i<cookie.length; i++) {
        var part = cookie[i].trim();

        if (part.indexOf(name) != -1) {
            return part.split('=')[1];
        }
    }
}

function setCookie(length, name, value) {
    var expires;
    var d = new Date();
    d.setTime(d.getTime() + (370 * 24 * 60 * 60 * 1000));
    expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

/* the ajaxer */

function _ajax() {
    /**
     * Contains XMLHttpRequest or ActiveXObject
     */
    this.object = window.ActiveXObject ? new window.ActiveXObject("Msxml2.XMLHTTP") : new XMLHttpRequest();

    /**
     * Perform ajax request
     * @param type string
     * @param datas object
     * @param url string
     * @param header string
     * @param callback scope
     * @param fail scope
     * @param timeout integer
     */
    this.query = function (type, datas, url, header, callback, fail, timeout) {
        this.object.open(type, url, true);
        
        /* filter post request */
        if (type.toLowerCase() == 'post') {

            this.object.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

            var stringvalues = [];

            for(var a in datas) {
                stringvalues.push(a+'='+datas[a]);
            }

            datas = stringvalues.join('&').toString();
        }

        /* onload event firing */
        this.object.onload = function () {
            if (this.status == 200) {
                if (callback) callback(this.responseText);
            }
            else {
                if (fail) fail("Une erreur s'est produite. CODE: "+this.status, this.status);
            }
        };

        /* onerror event firing */
        this.object.onerror = function () {
            if (fail) fail("Une erreur s'est produite. CODE: "+this.status, this.status);
        };

        /* timeout error event firing */
        this.object.ontimeout = function () {
            if (fail) fail("Une erreur s'est produite. CODE: TIMEOUT ERROR");
        };

        this.object.timeout = timeout ? timeout : this.timeout;

        // alert(datas);
        this.object.send(datas);
    }

    /**
     * Perform post requests
     * @param options object
     */
    this.post = function (options) {
        this.query('post', options.datas, options.url, options.header, options.callback, options.fail, options.timeout);
    }

    /**
     * Perform get requests
     * @param options object
     */
    this.get = function (options) {
        this.query('get', null, options.url, options.header, options.callback, options.fail, options.timeout);
    }
}