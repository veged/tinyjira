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
        e.preventDefault();
        var issues = new TinyJira.Issues();
        issues.fromFilter = thisFilter.json.id;
        issues.toDOM($('.b-page-content'));
    });

    if (parentNode) $(parentNode).append(li);

    this.dom = li;
    return li;
};


