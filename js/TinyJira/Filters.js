/**
 * Filters
 */
TinyJira.Filters = function(json) {
    this.json = json;
};
TinyJira.Filters.prototype.toDOM = function(parentNode) {
    var dom = $('<div>' +
        '<h2>Фильтры</h2>' +
        '<div class="b-filters-table TinyJira-c-Filters">' +
            '<ul></ul>' +
        '</div>'+
    '</div>');
    var ul = dom.find('ul');

    $(this.json.splice(0, 50)).each(function(){
        (new TinyJira.Filter(this)).toDOM(ul);
    });
    
    if (parentNode) $(parentNode).append(dom);
    
    return dom;
};
