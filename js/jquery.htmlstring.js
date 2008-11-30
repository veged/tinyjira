(function($){

var empty = {
    'br': true,
    'wbr': true,
    'img': true,
    'ht': true,
    'input': true,
    'link': true
}

$.htmlStringText = $.htmlStringText || function(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/\'/g,'&apos;')
        .replace(/"/g,'&quot;');
};

$.htmlString = $.htmlString || function() {
    var _this = this,
        html = '';

    if ($.isArray(arguments[0])) {
        if ($.isArray(arguments[0][0])) {
            $.each(arguments[0], function(){
                html += $.htmlString.apply(_this, this);
            });
        } else {
            html += $.htmlString.apply(_this, arguments[0]);
        }
    } else {
        var tagName = arguments[0], tagAttributes = {}, tagContent = '';
        if ($.isArray(arguments[1]) || typeof arguments[1] == 'string') {
            tagContent = arguments[1] || tagContent;
        } else {
            tagAttributes = arguments[1] || tagAttributes;
            tagContent = arguments[2] || tagContent;
        }

        if (tagName) {
            html += '<' + tagName;

            $.each(tagAttributes, function(n, v){
                html += ' ' + n + '="' + $.htmlStringText(v) + '"';
            });
        }
    
        if (empty[tagName]) {
            html += '/>';
        } else {
            if (tagName) html += '>';
            html += $.isArray(tagContent) ? $.htmlString.apply(_this, [tagContent]) : tagContent;
            if (tagName) html += '</' + tagName + '>';
        }
    }

    return html;
}

})(jQuery);
