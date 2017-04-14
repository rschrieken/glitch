var glob = require( 'glob' )
  , path = require( 'path' );

var exp = [];
glob.sync( './bots/commands/*.js' ).forEach( function( file ) {
  exp.push(require( path.resolve( file ) ));
});

exports.commands = exp;