/**
 * Filter
 */
TinyJira.Filter = function(json) {
    this.json = json;
};

TinyJira.Filter.prototype.toDOM = function(parentNode) {
    var thisFilter = this;
    var liHTML = $.htmlString('li', [
        ['a',
            {
                href: TinyJira.jira.url + 'secure/IssueNavigator.jspa?requestId=' + thisFilter.json.id + '&mode=hide',
                'class': 'b-pseudo-link'
            },
            ['span', thisFilter.json.name]
        ],
        ((thisFilter.json.description && thisFilter.json.description !== '') ? ['', ': ' + thisFilter.json.description] : [])
    ]);

    var li = $(liHTML);

    li.find('a').click(function(e){
        jQuery.jsonRpc({
            url: TinyJira.jira.url + '/plugins/servlet/rpc/json',
            method: TinyJira.jira.soap + '.getIssuesFromFilter',
            params: [null, thisFilter.json.id],
            success: function(x){
                /*
                $('.b-page-content').append(
                    $('<p></p>')
                    .text(JSON.stringify(x))
                );
                */
                (new TinyJira.Issues(x.result)).toDOM($('.b-page-content'));
            }
        });
        return false;
    });

    if (parentNode) $(parentNode).append(li);

    this.dom = li;
    return li;
};


