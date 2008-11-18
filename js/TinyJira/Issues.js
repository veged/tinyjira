/**
 * Issues
 */
TinyJira.Issues = function(json) {
    this.json = json;
    this.fromFilter = '';
};

TinyJira.Issues.prototype.reinit = TinyJira.reinit;

TinyJira.Issues.prototype.toDOM = function(parentNode) {
    var thisIssues = this,
        html = $.htmlString('div', [
            ['h2', {style:'font-size: 100%;'}, [
                ['span', {'class':'h2'}, 'Задачи' + (thisIssues.fromFilter ? ': ' + thisIssues.fromFilter.name : '')],
                (thisIssues.json ?
                    ['span', {'class':'b-sup-controls'}, [
                        [null, ' &nbsp;'],
                        ['sup', ['a', {'class':'b-pseudo-link refresh'}, ['span', 'обновить']]],
                        [null, ' &nbsp;'],
                        ['sup', ['a', {'class':'b-pseudo-link hide'}, ['span', 'скрыть']]]
                    ]] :
                    []
                ),
                ((thisIssues.fromFilter.description && thisIssues.fromFilter.description !== '') ?
                    ['span', {'class':'subheader'}, thisIssues.fromFilter.description] :
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
            thisIssues.reinit();
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
            params: [null, thisIssues.fromFilter.id],
            success: function(x){
                thisIssues.reinit(x.result);
            }
        });
    }

    if (parentNode) $(parentNode).append(dom);

    return dom;
};
