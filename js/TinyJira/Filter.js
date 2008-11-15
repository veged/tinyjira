/**
 * Filter
 */
TinyJira.Filter = function(json) {
    this.json = json;
};

TinyJira.Filter.prototype.toDOM = function(parentNode) {
    var thisFilter = this;
    var li = $(document.createElement('li'))
        .append(
            $('<a' +
                ' href="' + TinyJira.jira.url + 'secure/IssueNavigator.jspa?requestId=' + thisFilter.json.id + '&mode=hide">' +
                    thisFilter.json.name +
            '</a>')
            .click(function(e){
                e.preventDefault();
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
            })
        );
        
        if (thisFilter.json.description && thisFilter.json.description !== '') {
            li.append($('<span>: ' + thisFilter.json.description + '</span>'));
        }

    if (parentNode) $(parentNode).append(li);

    this.dom = li;
    return li;
};


