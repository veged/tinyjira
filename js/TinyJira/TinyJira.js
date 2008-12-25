var TinyJira = {
    jira: {
        //url: location.protocol + '//' + location.host + '/',
        url: $.cookie('jira-url'),
        auth: $.cookie('jira-auth')
    },
    options: {
        set: function(name, value) {
            $.cookie('jira-' + name, value);
            this[name] = value;
        },
        'issues-details': $.cookie('jira-issues-details')
    },
    layout: {
        content: '.h-page-c',
        sidebar: '.h-page-l',
        head: '.b-head-line h1'
    },

    init: function(callback) {
        var thisTinyJira = this;
        if (!thisTinyJira.jira.url) {
            thisTinyJira.jira.url = prompt('Какой адрес у JIRA?', 'http://jira/');
            $.cookie('jira-url', thisTinyJira.jira.url);
        }

        $().bind('TinyJira:login', function(e, auth){
            $.cookie('jira-auth', auth);
            thisTinyJira.jira.auth = auth;
            thisTinyJira.getCurrentUser();
        });

        jQuery.jsonRpc({
            url: thisTinyJira.jira.url + 'plugins/servlet/rpc/json',
            method: 'jira.getSoapService',
            params: ['jirasoapservice-v2-yandex'],
            success: function(x){
                thisTinyJira.jira.soap = '.obj[' + x.result.objectID + ']';
                thisTinyJira.getCurrentUser = function() {
                    jQuery.jsonRpc({
                        url: thisTinyJira.jira.url + 'plugins/servlet/rpc/json',
                        method: 'jira.getCurrentUser',
                        params: [thisTinyJira.jira.auth],
                        success: function(x){
                            if (!x.result) {
                                $(TinyJira.layout.content).each(function(){
                                    (new TinyJira.Login()).toDOM(this);
                                });
                            } else {
                                $(thisTinyJira.layout.head)
                                    .html($.htmlString([
                                        ['span', {'class': 'h1'}, 'джиронька и ' + x.result.login + ' '],
                                        ['span', {'class': 'b-sup-controls'},
                                            ['sup', ['a', {'class': 'logout', href: ''}, 'выйти']]
                                        ]
                                    ]))
                                    .delegate('click', '.logout', function(e){ $.cookie('jira-auth', null) });
                                thisTinyJira.user = x.result;
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
    },
    createIssue: function(params, callbacks) {
        if ($.isFunction(callbacks)) callbacks = {success: callbacks};
        jsonRpcOptions = {
            url: TinyJira.jira.url + 'plugins/servlet/rpc/json',
            method: TinyJira.jira.soap + '.createIssue',
            params: [TinyJira.jira.auth, params],
            success: function(x){
                if (!x.result) {
                    var _this = this,
                        _arguments = arguments;
                    $.each(['complete', 'error'], function(i, v) {
                        if (callbacks[v]) callbacks[v].apply(_this, _arguments);
                    });
                } else {
                    var newIssue = new TinyJira.Issue(x.result),
                        updateCallbacks = {};
                    $.each(['complete', 'success', 'error'], function(i, v) {
                        if (callbacks[v]) updateCallbacks[v] = callbacks[v];
                    });
                    newIssue.update({customfield_10380: 'tinyjira'}, updateCallbacks);
                }
            }
        };

        if (callbacks.error) jsonRpcOptions.error = callbacks.error;

        jQuery.jsonRpc(jsonRpcOptions);
    }
};
