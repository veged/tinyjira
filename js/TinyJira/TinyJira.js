var TinyJira = {
    jira: {
        //url: location.protocol + '//' + location.host + '/',
        url: $.cookie('jira-url'),
        auth: $.cookie('jira-auth')
    },
    init: function(callback) {
        var thisTinyJira = this;
        if (!thisTinyJira.jira.url) {
            thisTinyJira.jira.url = prompt('Какой адрес у JIRA?', 'http://jira/');
            $.cookie('jira-url', thisTinyJira.jira.url);
        }
        jQuery.jsonRpc({
            url: thisTinyJira.jira.url + 'plugins/servlet/rpc/json',
            method: 'jira.getSoapService',
            params: ['jirasoapservice-v2-yandex'],
            success: function(x){
                thisTinyJira.jira.soap = '.obj[' + x.result.objectID + ']';
                thisTinyJira.getCurrentUser = function() {
                    jQuery.jsonRpc({
                        url: thisTinyJira.jira.url + '/plugins/servlet/rpc/json',
                        method: 'jira.getCurrentUser',
                        params: [thisTinyJira.jira.auth],
                        success: function(x){
                            if (!x.result) {
                                (new thisTinyJira.Login()).toDOM($('.h-page-c'));
                            } else {
                                $('.b-head-line h1')
                                    .html($.htmlString([
                                        ['span', {'class': 'h1'}, 'джиронька и ' + x.result.login + ' '],
                                        ['span', {'class': 'b-sup-controls'},
                                            ['sup', ['a', {'class': 'logout', href: ''}, 'выйти']]
                                        ]
                                    ]))
                                    .delegate('click', '.logout', function(e){ $.cookie('jira-auth', null) });
                                callback.call(thisTinyJira);
                            }
                        }
                    });
                };
                thisTinyJira.getCurrentUser();
            }
        });
    },
    reinit: function(json) {
        this.json = json || this.json;
        var oldDOM = this.dom;
        var newDOM = this.toDOM();
        oldDOM.hide().after(newDOM);
        setTimeout(function(){oldDOM.remove()}, 1);
    }
};
