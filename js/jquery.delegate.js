/*! Copyright (c) 2008, Three Dub Media (http://threedubmedia.com)  */
;(function($){ // secure $ jQuery alias
/*******************************************************************************************/
// jquery.delgate.js - rev 5
// Liscensed under the MIT License 
// http://www.opensource.org/licenses/mit-license.php
// Created: 2008-08-14 | Updated: 2008-10-10
/*******************************************************************************************/

// extend jquery prototype, twice
$.fn.delegate = function( types, selector, handler, data ){
	return this.each(function(){	
		$.event.delegate.add( this, types, selector, handler, data );
		});
	}; 
$.fn.undelegate = function( types, selector, handler ){
	return this.each(function(){
		$.event.delegate.remove( this, types, selector, handler ); 
		});
	};

// extend the jquery.event object
$.event.delegate = {
	// ADD DELEGATES
	add: function( elem, types, selector, handler, data ){
		// first four arguments are required
		if ( arguments.length < 4 ) return;
		// handle single/multiple comma-seperated selectors...
		var selectors = split( selector, comma ),  
		// reference or create an event delegation repository 
		repos = $.data( elem, 'delegates' ) || $.data( elem, 'delegates', {} );
		// handle single/multiple space seperated event types...
		$.each( split( types, space ), function( i, type ){
			// reference or create event.type delegate cache
			var cache = repos[ type ] || ( repos[ type ] = [] );
			// bind the master delegate handler for this event.type
			if ( !cache.length ) $.event.add( elem, type, $.event.delegate.handle, data );
			// store the handler with each selector
			$.each( selectors, function( i, selector ){
				// no empty strings
				if ( !selector.length ) return;
				// add the delegate selector and handler into the cache (push)
				cache[ cache.length ] = { selector: selector, handler: handler };
				});
			});
		},
	// REMOVE DELEGATES	
	remove: function( elem, types, selector, handler ){
		// handle single/multiple comma-seperated selectors...
		var selectors = split( selector, comma ),
		// reference event delegation repository 
		repos = $.data( elem, 'delegates' ) || {};
		// remove ALL types and selectors
		if ( elem && !types ){
			// iterate all delegate types stored on this element
			$.each( repos, function( type ){
				// unbind the master delegate handler for each type 					
				$.event.remove( elem, type, $.event.delegate.handle );
				});
			// clean-up stored data on this element
			$.removeData( elem, 'delegates' );
			// stop
			return;
			}
		// handle single/multiple space seperated event types...
		$.each( split( types, space ), function( i, type ){	
			// are there any selectors to check?
			if ( selector && selector.length ){
				// iterate all the stored selectors and handlers...
				repos[ type ] = $.grep( repos[ type ] || [], function( stored, keep ){
					// check against each passed selector
					if ( stored ) $.each( selectors, function( x, selector ){
						// match selector, and handler if provided
						if ( stored.selector === selector && ( !handler || stored.handler === handler ) )
							// break and set flag to remove data
							return ( keep = false );
						});	
					// remove or keep stored data
					return ( keep !== false );
					});
				// if cache is NOT empty, stop
				if ( repos[ type ].length ) return; 
				}
			// unbind the master delegate handler for this event.type 
			$.event.remove( elem, type, $.event.delegate.handle );
			// clean-out cached data for this event.type
			delete repos[ type ]; 	
			});
		},
	// HANDLE EVENT DELEGATION
	handle: function( event ){
		// store the master delegate element
		event.delegateParent = this;
		// local element, local variables
		var target = event.target, args = arguments, ret,
		// get delegates for this element and event.type
		cache = ( $.data( this, 'delegates' ) || {} )[ event.type ] || [];
		// iterate stored delegate selectors		
		if ( cache.length ) do $.each( cache, function( i, stored ){
			// match the target element to the delegate selector										   
			if ( stored && $( target ).is( stored.selector ) ) {
				// call the stored handler function
				ret = stored.handler.apply( target, args );
				// break $.each if FALSE
				return ( ret!==false );
				}
			});
		// walk up the parent tree to the delegate source/parent
		while ( ret !== false && target != this && ( target = target.parentNode ) )
		// pass along the latest handler return value
		return ret;
		}
	};

// white-space regexp and comma-sep regexp for splitting strings
var space = /\s+/, comma = /\s*,\s*/;  

// split and trim space seperated event types or comma-seperated selectors
function split( str, regexp ){ return $.trim( str ).split( regexp ); }; 

/*******************************************************************************************/
})(jQuery);