/**
 * Issues
 */
TinyJira.Issues = function(json) {
    this.json = json;
};
TinyJira.Issues.prototype.toDOM = function(parentNode) {
    var dom = $('<div>' +
        '<h2>Задачи</h2>' +
        '<div class="b-issues-table TinyJira-c-IssuesTable">' +
        '<table>' +
            '<tr>' +
                '<th>Ключ</th>' +
                '<th width="100%">Описание</th>' +
                '<th>Приоритет</th>' +
                '<th>Статус</th>' +
                '<th class="progress"><div></div></th>' +
            '</tr>' +
        '</table>' +
        '</div>'+
    '</div>');
    var table = dom.find('table');

    $(this.json.splice(0, 50)).each(function(){
        (new TinyJira.Issue(this)).toDOM(table);
    });
    
    if (parentNode) $(parentNode).append(dom);
    
    return dom;
};
