// Code created by Zoe the Wolf: https://chat.meta.stackexchange.com/users/332043

//a tags have a different system from the rest of the tags, as it has data that has to be included in the result
const htmlparser2 = require("htmlparser2");
var a = new RegExp('<a href=\".*?\" rel=\".*?\">.*?<\/a>');

var front = new RegExp("<a href=\".*?\">");
var back = new RegExp("</a>");

//<b><i>
var biFront = new RegExp("<\/b><\/i>", 'g');
var biBack = new RegExp("<\/b><\/i>", 'g');
//<i>
var iFront = new RegExp("<i\>", 'g');
var iBack = new RegExp("<\/i\>", 'g');
//<b>
var bFront = new RegExp("<b\>", 'g');
var bBack = new RegExp("<\/b\>", 'g');
//<code>
var icFront = new RegExp("<code>", 'g');
var icBack = new RegExp("<\/code>", 'g');


function cleanInput(input){
    console.log(input + " = " + typeof input);
    if(typeof input === 'string'){
        //Clean up unicode chars
        input = replaceAll(input, "\u003c", "<");
        input = replaceAll(input, "\u003e", ">");
        input = replaceAll(input, "\u202e", "");
        //parse any HTML
        input = parse(input);
      
        return input;
    }
    return null;
}

function parse(input){
    
    if(typeof input === 'string'){
        var htmlDoc = htmlparser2.parseDOM(input);
      
        if(htmlDoc != null && htmlDoc.length != 0){    
            for(var i = 0; i < htmlDoc.length; i++){
                if(htmlDoc[i].name === "a"){
                  
                    var attribs = htmlDoc[i].attribs;
                    var href = attribs.href;
                    
                    if(href == null) continue;

                    input = replace(input, front, "[");
                    input = replace(input, back, "](" + href + ")");
                
                }
            }
        }
    
        
        input = replace(input, biFront, "***");
        input = replace(input, biBack, "***");
        input = replace(input, iFront, "*");
        input = replace(input, iBack, "*");
        input = replace(input, bFront, "**");
        input = replace(input, bBack, "**");
        input = replace(input, icFront, "`");
        input = replace(input, icBack, "`");
      
        return input;
    }
  
    return null;
}

function replace(input, regex, replacement){
   return input.replace(regex, replacement); 
}

function replaceAll(haystack, needle, replacement){
   return haystack.replace(new RegExp(needle, 'g'), replacement);
}
module.exports.cleanInput = cleanInput;