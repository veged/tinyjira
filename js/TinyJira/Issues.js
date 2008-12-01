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
            ['h2', {style:'font-size: 100%; margin: 1.8em 0 0.72em 0;'}, [
                ['span', {'class':'h2'}, 'Задачи' + (thisIssues.fromFilter ? ': ' + thisIssues.fromFilter.name : '')],
                (thisIssues.json ?
                    ['span', {'class':'b-sup-controls'}, [
                        [null, ' &nbsp;'],
                        ['sup', ['a', {'class':'b-pseudo-link refresh', href:'javascript:'}, ['span', 'обновить']]],
                        [null, ' &nbsp;'],
                        ['sup', ['a', {'class':'b-pseudo-link hide', href:'javascript:'}, ['span', 'скрыть']]]
                    ]] :
                    []
                ),
                ((thisIssues.fromFilter.description && thisIssues.fromFilter.description !== '') ?
                    ['span', {'class':'subheader'}, thisIssues.fromFilter.description] :
                    []
                )
            ]],
            ['div', {'class': 'b-issues-table TinyJira-c-IssuesTable b-issues-table-' + (TinyJira.options['issues-details'] ? 'long' : 'short')},
                (thisIssues.json ?
                    ['table', ['tr', $.map(
                            ['Ключ', '&ensp;Описание', 'Приоритет', 'Статус'],
                            function(v, i) {
                                var span = $.htmlString('span', {'class': 'th'}, v);
                                if (i == 1 && thisIssues.json.length > 0) {
                                    span += ' ' + $.htmlString(
                                        'a', {'class': 'b-pseudo-link issues-details', href: 'javascript:'},
                                        ['span', TinyJira.options['issues-details'] ? 'сократить' : 'расширить']
                                    );
                                }
                                return $.htmlString('th', (i == 1 ? {width:'100%'} : {}), span);
                            }
                        ).join('') + $.htmlString('th', {'class':'progress'}, ['div'])
                    ]] :
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

        dom.find('th, .b-sup-controls')
            .delegate('click', '.issues-details', function(e){
                var thisLink = $(this),
                    switchedHTML = thisLink.data('switchedHTML') || $.htmlString('span', TinyJira.options['issues-details'] ? 'расширить' : 'сократить');
                thisLink.data('switchedHTML', thisLink.html());

                thisLink
                    .html(switchedHTML)
                    .parents('.b-issues-table').toggleClass('b-issues-table-short').toggleClass('b-issues-table-long');

                TinyJira.options.set('issues-details', TinyJira.options['issues-details'] ? null : true);
                return false;
            })
            .delegate('click', '.refresh', function(e){
                delete thisIssues.json;
                thisIssues.reinit();
                return false;
            })
            .delegate('click', '.hide', function(e){
                thisIssues.dom.hide();
                delete thisIssues.json;
                setTimeout(function(){thisIssues.dom.remove()}, 1);
                return false;
            });

    } else {
        jQuery.jsonRpc({
            url: TinyJira.jira.url + 'plugins/servlet/rpc/json',
            method: TinyJira.jira.soap + '.getIssuesFromFilter',
            params: [TinyJira.jira.auth, thisIssues.fromFilter.id],
            success: function(x){
                thisIssues.reinit(x.result);
            }
        });
    }

    if (parentNode) $(parentNode).append(dom);

    return dom;
};
