
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
  
  function FormParser(res) {
    var metaform = {}, state = 0;
    
    metaform.url = res.path;
    
    function executor(resolve, reject) {
      var parser = new htmlparser.Parser(
         {
           onopentag: function(tagname, attr) {
             if (state === 0 && tagname === 'form' && 
                 attr.method && attr.method === 'post' && 
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
        console.log(error);
        reject(error);
      });
      res.on('end', (d) => {
        console.log(res.headers, res.trailers);
        parser.end();
        console.log(metaform);
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
             if (auth_form && tagname === 'input' 
                 && attr.name && attr.name === 'openid_identifier'
                 && attr.value && attr.value.length > 0) {
               auth_form.form[attr.name] = attr.value;
             }
             if ((auth_form === undefined) && tagname === 'form' && 
                 attr.method && attr.method === 'post' && 
                 attr.action && attr.action ==='/users/authenticate' )  {    
               auth_form = {}
               auth_form.form = {};
               auth_form.post = '/users/authenticate';
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
        resolve(JSON.parse(jsonstring));
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
    case 'json':
      parserImpl = new JSONParser(response);
      break;
    case 'debug':
      parserImpl = new DebugParser(response);
      break;
    default:
      parserImpl = new DebugParser(response);
      break;
  }
  
  return parserImpl;
}

module.exports = ResponseParser;