/**
 * Filters
 */
TinyJira.Filters = function(json) {
    this.json = json;
};

TinyJira.Filters.prototype.toDOM = function(parentNode) {
    var thisFilters = this,
        html = $.htmlString('div', [
            ['h2', 'Фильтры'],
            ['div', {'class': 'b-filters TinyJira-c-Filters'},
                (thisFilters.json ? '<ul></ul>' : ['span', {'class':'b-progress'}, '<i></i>'])
            ]
        ]);

    var dom = $(html);
    thisFilters.dom = dom;

    if (thisFilters.json) {
        var ul = dom.find('ul');
        $(thisFilters.json.splice(0, 50)).each(function(){
            (new TinyJira.Filter(this)).toDOM(ul);
        });
    } else {
        jQuery.jsonRpc({
            url: TinyJira.jira.url + '/plugins/servlet/rpc/json',
            method: TinyJira.jira.soap + '.getSavedFilters',
            params: [null],
            success: function(x){
                var oldDOM = thisFilters.dom;
                thisFilters.json = x.result;
                var newDOM = thisFilters.toDOM();
                oldDOM.hide().after(newDOM);
                setTimeout(function(){oldDOM.remove()}, 1);
            }
        });
    }
    
    if (parentNode) $(parentNode).append(dom);
    
    return dom;
};
