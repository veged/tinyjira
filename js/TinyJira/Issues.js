/**
 * Issues
 */
TinyJira.Issues = function(json) {
    this.json = json;
    this.fromFilter = '';
};
TinyJira.Issues.prototype.toDOM = function(parentNode) {
    var thisIssues = this,
        html = $.htmlString('div', [
            ['h2', [
                [null, 'Задачи'],
                (thisIssues.json ?
                    ['span', {'class':'b-sup-controls'}, [
                        [null, ' &nbsp;'],
                        ['sup', ['a', {'class':'b-pseudo-link refresh'}, ['span', 'обновить']]],
                        [null, ' &nbsp;'],
                        ['sup', ['a', {'class':'b-pseudo-link hide'}, ['span', 'скрыть']]]
                    ]] :
                    []
                )
            ]],
            ['div', {'class': 'b-issues-table TinyJira-c-IssuesTable'},
                (thisIssues.json ?
                    ['table', ['tr', [
                        ['th', 'Ключ'],
                        ['th', {width:'100%'}, 'Описание'],
                        ['th', 'Приоритет'],
                        ['th', 'Статус'],
                        ['th', {'class':'progress'}, ['div']]
                    ]]] :
                    ['span', {'class':'b-progress'}, '<i></i>']
                )
            ]
        ]);

    var dom = $(html);
    thisIssues.dom = dom;

    if (thisIssues.json) {
        var table = dom.find('table');
        $(thisIssues.json.splice(0, 50)).each(function(){
            (new TinyJira.Issue(this)).toDOM(table);
        });

        dom.find('.b-sup-controls .refresh').click(function(e){
            e.preventDefault();
            delete thisIssues.json;
            var oldDOM = thisIssues.dom;
            var newDOM = thisIssues.toDOM();
            oldDOM.hide().after(newDOM);
            setTimeout(function(){oldDOM.remove()}, 1);
        });

        dom.find('.b-sup-controls .hide').click(function(e){
            e.preventDefault();
            thisIssues.dom.hide();
            delete thisIssues.json;
            setTimeout(function(){thisIssues.dom.remove()}, 1);
        });

    } else {
        jQuery.jsonRpc({
            url: TinyJira.jira.url + '/plugins/servlet/rpc/json',
            method: TinyJira.jira.soap + '.getIssuesFromFilter',
            params: [null, thisIssues.fromFilter],
            success: function(x){
                var oldDOM = thisIssues.dom;
                thisIssues.json = x.result;
                var newDOM = thisIssues.toDOM();
                oldDOM.hide().after(newDOM);
                setTimeout(function(){oldDOM.remove()}, 1);
            }
        });
    }

    if (parentNode) $(parentNode).append(dom);

    return dom;
};
