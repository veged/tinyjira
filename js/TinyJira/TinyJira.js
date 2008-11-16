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
                            (new thisTinyJira.Login()).toDOM($('.h-page-c'));
                        } else {
                            callback.call(thisTinyJira);
                        }
                    }
                });
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
