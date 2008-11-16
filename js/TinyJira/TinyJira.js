var TinyJira = {
    jira: {
        url: location.protocol + '//' + location.host + '/'
    },
    init: function(callback) {
        var thisTinyJira = this;
        jQuery.jsonRpc({
            url: thisTinyJira.jira.url + 'plugins/servlet/rpc/json',
            method: 'jira.getSoapService',
            params: ['jirasoapservice-v2-yandex'],
            success: function(x){
                thisTinyJira.jira.soap = '.obj[' + x.result.objectID + ']';
                jQuery.jsonRpc({
                    url: thisTinyJira.jira.url + '/plugins/servlet/rpc/json',
                    method: 'jira.getCurrentUser',
                    params: [null],
                    success: function(x){
                        if (!x.result) {
                            (new thisTinyJira.Login()).toDOM($('.b-page-content'));
                        } else {
                            callback.call(thisTinyJira);
                        }
                    }
                });
            }
        });
    }
};
