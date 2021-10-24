
const htmlparser = require('htmlparser2');
const StringDecoder = require('string_decoder').StringDecoder;

// builds any of the parsers (kind of Factory)
function ResponseParser(type, response) {
  var parserImpl = null;
  
  // dumps the response to the console
  function DebugParser(res) {
    function executor(resolve, reject) {
      res.on('data', (d) => {
        console.log(d.toString());
      });
      res.on('error', (d) => {
        console.log(d);
        reject(d);
      });
      res.on('end', (d) => {
        resolve();
      });
    }
    return new Promise(executor);
  }
  
  // looks for the image url
  function HtmlScriptParser(res) {
    var url, script = '', state = 0;
    
    function executor(resolve, reject) {
      var parser = new htmlparser.Parser(
         {
           onopentag: function(tagname, attr) {
             if (state === 0 && tagname === 'html' )  {        
               state++;
             }
             if (state === 1 && tagname === 'head' )  {        
               state++;
             }
             if (state === 2 && tagname === 'script') {
               state++;
             }             
           },
           ontext: function(text) {
             if (state === 3) {
               console.log(text);
               script += text;
             }
           },
           onclosetag: function(tagname) {
             if (['html','head','script'].indexOf(tagname) > -1) {
               state--;
             }
           }
         },{ decodeEntities: true }
      );
      res.on('data', (d) => {
         parser.write(d);
      });
      res.on('error', (error) => {
        console.log(error);
        reject(error);
      });
      res.on('end', (d) => {
        console.log("hsp", res.headers, res.trailers);
        parser.end();
        console.log('hsp script', script);
        const regex = /^\s+var\s+result\s+=\s+'(.*)';$/gm;
        let m;

        while ((m = regex.exec(script)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                console.log(`Found match, group ${groupIndex}: ${match}`);
              if (groupIndex === 1) url = match;
            });
        }
        if (url) {
          //console.log(auth_form);
          resolve(url);
        } else {
          reject(false);
        }
      });
    };
    return new Promise(executor);
  }
  
  function FormParser(res) {
    var metaform = {}, state = 0;
    
    metaform.url = res.path;
    
    function executor(resolve, reject) {
      var parser = new htmlparser.Parser(
         {
           onopentag: function(tagname, attr) {
             if (state === 0 && tagname && tagname.toLowerCase() === 'form' && 
                 attr.method && attr.method.toLowerCase() === 'post' && 
                 attr.action )  {        
               metaform.form = {};
               metaform.action = attr.action;
               state++;
             }
             if (state > 0 && tagname === 'input' && attr.name) {
               metaform.form[attr.name] = attr.value;
             }             
           },
           onclosetag: function(tagname) {
             if (state > 0 && tagname === 'form') {
               state = -1;
             }
           }
         },{ decodeEntities: true }
      );
      res.on('data', (d) => {
         parser.write(d);
      });
      res.on('error', (error) => {
        console.error(error);
        reject(error);
      });
      res.on('end', (d) => {
        console.log('formparser end', res.headers, res.trailers);
        parser.end();
        console.log('formparser end', metaform);
        if (metaform) {
          //console.log(auth_form);
          resolve(metaform);
        } else {
          reject('no form found');
        }
      });
    }
    return new Promise(executor);   
  }
  
  function FkeyParser(res) {
    var fkeyParsed, content='', auth_form;
    function executor(resolve, reject) {
      var parser = new htmlparser.Parser(
         {
           onopentag: function(tagname, attr) {
             
             if (tagname === 'input' && attr.name && attr.name === 'fkey') {
               fkeyParsed = attr.value;
             }
             
             if (auth_form && tagname === 'input' && attr.name && attr.name === 'fkey') {
               auth_form.form[attr.name] = attr.value;
             }
             if (auth_form && tagname === 'input' && attr.name && attr.name === 'cdl') {
               auth_form.form[attr.name] = attr.value;
             }
             if (auth_form && tagname === 'input' && attr.name && attr.name === 'ssrc') {
               auth_form.form[attr.name] = attr.value;
             }
             if (auth_form && tagname === 'input' 
                 && attr.name && attr.name === 'openid_identifier'
                 && attr.value && attr.value.length > 0) {
               auth_form.form[attr.name] = attr.value;
             }
             if ((auth_form === undefined) && tagname === 'form' && 
                 attr.method && attr.method.toLowerCase() === 'post' && 
                 attr.action && (attr.action ==='/users/authenticate' || attr.action.indexOf('/users/login?returnurl=https') === 0) )  {    
               auth_form = {}
               auth_form.form = {};
               auth_form.post = attr.action;
             }
           }
         },{ decodeEntities: true }
      );
      res.on('data', (d) => {
         //content += d.toString();
         parser.write(d);
      });
      res.on('error', (error) => {
        console.log(error);
        reject(error);
      });
      res.on('end', (d) => {
        parser.end();
        //console.log(content);
        if (fkeyParsed && fkeyParsed.length > 0) {
          //console.log(auth_form);
          resolve({fkey: fkeyParsed, auth: auth_form });
        } else {
          reject('no fkey found');
        }
      });
    }
    return new Promise(executor);
  }
  
  function IdentityParser(res) {
    var fkeyParsed, userid;
    function executor(resolve, reject) {
      var parser = new htmlparser.Parser(
         {
           onopentag: function(tagname, attr) {
             var classnames, i, key, value, kvp;
             if (tagname === 'input' && attr.name && attr.name === 'fkey') {
               fkeyParsed = attr.value;
             }
             if (tagname === 'div' && 
                 attr.id && 
                 attr.id === 'active-user' &&
                 attr.class) {
               classnames = attr.class.split(' ');
               for(i = 0; i < classnames.length; i++) {
                 kvp = classnames[i].split('-');
                 if (kvp.length ===2) {
                   if (kvp[0] === 'user') {
                     value = parseInt(kvp[1], 10);
                     if (!Number.isNaN(value)) {
                       userid = value;
                     }
                   }
                 }
               }
             }
           }
         },{ decodeEntities: true }
      );
      res.on('data', (d) => {
         parser.write(d);
      });
      res.on('error', (error) => {
        console.log(error);
        reject(error);
      });
      res.on('end', (d) => {
        parser.end();
        if (fkeyParsed && fkeyParsed.length > 0) {
          resolve({ fkey: fkeyParsed, userid: userid});
        } else {
          reject('no identity found');
        }
      });
    }
    return new Promise(executor);
  }
  
  function MainChatParser(res) {
    var fkeyParsed, userurl, username, states = {
      none: 0,
      topbarlinks: 1,
      linkscontainer: 2,
      topbarmenulinks: 3,
      topbarmenulinkstext: 4,
      complete: 5
    }, state = states.none;
    function executor(resolve, reject) {
      var parser = new htmlparser.Parser(
         {
           onopentag: function(tagname, attr) {
             //console.log('%s, %d', tagname, state);
             if (tagname === 'input' && attr.name && attr.name === 'fkey') {
               fkeyParsed = attr.value;
             }
             switch(state){
               case states.none:
                 if (tagname === 'div' && attr.class && attr.class === 'topbar-links') {
                   state = states.topbarlinks;
                 }
                 break;
               case states.topbarlinks:
                 if (tagname === 'div' && attr.class && attr.class === 'links-container') {
                   state = states.linkscontainer;
                 }
                 break;
              case states.linkscontainer:
                 if (tagname === 'span' && attr.class && attr.class === 'topbar-menu-links') {
                   state = states.topbarmenulinks;
                 }
                 break;
              case states.topbarmenulinks:
                 if (tagname === 'a' && attr.href) {
                   userurl = attr.href;
                   state = states.topbarmenulinkstext;
                 }
                 break;
             }
           },
           ontext: function(text) {
             if (state === states.topbarmenulinkstext) {
               username = text;
               state = states.complete;
             }
           }
         },{ decodeEntities: true }
      );
      res.on('data', (d) => {
         parser.write(d);
      });
      res.on('error', (error) => {
        console.log(error);
        reject(error);
      });
      res.on('end', (d) => {
        parser.end();
        if (state === states.complete && username && userurl) {
          console.log('found login: "%s", %s', userurl, username);
          resolve({username:username, url:userurl, fkey: fkeyParsed});
        } else{
          reject('parsing failed');
        }
      });
    }
    return new Promise(executor);
  }
  
  function JSONParser(res) {
    const decoder = new StringDecoder('utf8');
    var jsonstring = '';
    function executor(resolve, reject) {
      res.on('data', (d) => {
        jsonstring +=  decoder.write(d);
      });
      res.on('error', (error) => {
        console.log(error);
        reject(error);
      });
      res.on('end', (d) => {
        jsonstring += decoder.end(d);
        var  obj;
        try {
          obj =  JSON.parse(jsonstring)
        } catch(er)
        {
          console.log('no json? ',jsonstring);
          reject(new Error('no json recvd'));
        }
        resolve(obj);
      });
    }
    return new Promise(executor);
  }
  
  switch(type) {
    case 'form':
      parserImpl = new FormParser(response);
      break;
    case 'fkey':
      parserImpl = new FkeyParser(response);
      break;
    case 'ident':
      parserImpl = new IdentityParser(response);
      break;
    case 'mainchat':
      parserImpl = new MainChatParser(response);
      break;
    case 'json':
      parserImpl = new JSONParser(response);
      break;
    case 'debug':
      parserImpl = new DebugParser(response);
      break;
    case 'image':
      parserImpl = new HtmlScriptParser(response);
      break;
    default:
      parserImpl = new DebugParser(response);
      break;
  }
  
  return parserImpl;
}

module.exports = ResponseParser;