const https = require('https');
const http = require('http');
const querystring = require('querystring');
const tc = require('tough-cookie');
const FileCookieStore = require('file-cookie-store');
const URL = require('url');

function Browser(dummyjar) {
  
  var store;
  if (process.env.JARSTORE === 'FILE') {
    store = new FileCookieStore(".data/cookie.txt")
  } 
  
  const jar = new tc.CookieJar(store);
  var lastCookies = '';
  var currentUrl;
  
  function getCookieHeader(cookies) {
    var s=[], c;
    if (Array.isArray(cookies)) {
      for(c = 0; c < cookies.length; c++) {
        s.push(cookies[c].key + '=' + cookies[c].value);
      }
    } else {
      s.push(cookies.key + '=' + cookies.value);
    }
    lastCookies = s.join('; ');
    return lastCookies;
  }

  function saveCookies(setcookie, url) {
    if (setcookie !== undefined) {
      if (Array.isArray(setcookie)) {
        for(var c in setcookie) {
          jar.setCookie(setcookie[c], url, {}, function(err, cookie) { if (err) {console.log(err);} });
        }
      } else {
        jar.setCookie(setcookie, url, {}, function(err, cookie) { if(err) {console.log(err);} });
      }
    } else {
      //console.log('savecookies: no cookies for %s', url);
    }
  }
  
  function cookie () {
    return lastCookies;
  }
  
  function request(options, data) {
    var httpImpl = options.protocol === 'http:' ? http : https;
    //console.log(options);
    //console.log(data);
    function executor(resolve, reject) {
      var req = httpImpl.request(options, (res) => {
        //console.log(res.statusCode);
        saveCookies(res.headers['set-cookie'], URL.format(options));
        if (res.statusCode === 301 || res.statusCode === 302 ) {
          var opt = URL.parse(res.headers['location']);
          opt.protocol = opt.protocol || options.protocol;
          opt.host = opt.hostname || options.hostname;
          // TODO:add some handling for redirect loops?
          console.log('redirect ' + URL.format(opt));
          get(URL.format(opt)).then(resolve).catch(reject);
        } else {
          if (res.statusCode > 399) {
            console.log('request %i, %s', res.statusCode, options.path);
            reject(res);
          } else {
            resolve(res);
          }
        }
      });
      req.on('error', (e) => {
        reject(e);
      });
      if (data !== undefined) {
        req.write(querystring.stringify(data));
      }
      req.end();
    }
    return new Promise(executor)
  }
  
  function optionsBuilder(url, method, headers) {
    var urlObject = URL.parse(url);  
    currentUrl = url;
    function executor(resolve, reject) {
      jar.getCookies(url, function(error,cookies) {  
        if (error) {
          reject(error);
        } else {
          var options = {
              hostname: urlObject.hostname,
              port: urlObject.port,
              protocol: urlObject.protocol,
              path: urlObject.path,
              method: method,
              headers : headers || {}
          };
          options.headers.Cookie = getCookieHeader(cookies);
          options.headers['User-Agent'] = 'KennyBot/0.1 (+https://meta.stackexchange.com/users/269324/kennybot)'
          resolve(options);
        }
      });  
    }
    return new Promise(executor);
  }
  
  function get(url) {
    return optionsBuilder(url, 'GET').then(request);
  }
  
  function post(url, headers, data) {
    return optionsBuilder(url, 'POST', headers).then((opt) => request(opt,data));
  }
  
  function postform(url, data) {
    return post(url, {
      'Content-Type': 'application/x-www-form-urlencoded',
    }, data);
  }
  
  return {
    get: get,
    postform: postform,
    cookie: cookie,
    url: function() { return currentUrl;}
  };
}

exports.Browser = Browser;