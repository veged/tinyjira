/**
 * Issue
 */
TinyJira.Issue = function(json) {
    this.json = json;
};

TinyJira.Issue.prototype.setPriority = function(priority) {
    var thisIssue = this;
    thisIssue.startProgress();
    jQuery.jsonRpc({
        url: TinyJira.jira.url + '/plugins/servlet/rpc/json',
        method: 'jira.updateIssue',
        params: [null, thisIssue.json.key, { javaClass: "java.util.HashMap", map: {
            priority: [String(priority)]
        }}, true],
        complete: function(){ thisIssue.stopProgress() },
        success: function(x){
            thisIssue.json = x.result.issue;
            thisIssue.dom.replaceWith(thisIssue.toDOM());
        }
    });
};

TinyJira.Issue.prototype.update = function(fieldValues) {
    var thisIssue = this;
    this.dom.find('td.progress').html("<span class=\"b-progress\"><img src=\"i/progress_80.gif\" width=\"80\" height=\"16\" alt=\"...\" /></span>");
    /*
    TinyJira.jira.xmlrpc.call({
        method: "jiraYandex.updateIssue",
        params: [TinyJira.jira.user.auth, this.json.key, fieldValues],
        onload: function(issue){
            thisIssue.json = issue;
            y5.Dom.replaceNode(thisIssue.dom, thisIssue.toDOM());
        },
        onerror: function(e){
            y5.Console.warn("Error on updateIssue. ", e, ["TinyJira"]);
            y5.Dom.replaceNode(thisIssue.dom, thisIssue.toDOM());
        }
    });
    */
};

TinyJira.Issue.prototype.progressWorkflowAction = function(fieldValues) {
};

TinyJira.Issue.prototype.toDOM = function(parentNode) {
    var thisIssue = this;
    var tr = $(document.createElement('tr'))
        .hoverable()

        .append(
            $('<td><a' +
                ' href="TinyJira.server.baseUrl/browse/' + this.json.key + '"' +
                ' style="white-space: nowrap;">' +
                    this.json.key +
            '</a></td>')
            .hoverable()
        )

        .append(
            $('<td class="alltext"></td>')
            .append(
                $('<div class="summary"></div>')
                .text(String(thisIssue.json.summary))
            )
            .each(function(){
                if (thisIssue.json.description) {
                    $(this).addClass('alltext-descclosed')
                    .click(function(){
                        $(this).toggleClass('alltext-descclosed').toggleClass('alltext-descopen');
                    })
                    .append(
                        $('<div class="description"></div>')
                        .text(String(thisIssue.json.description))
                    )
                }
            })
            .hoverable()
        )

        .append(
            $('<td class="priority"></td>')
            .append(
                $('<div class="b-priority"></div>')
                .each(function(){
                    var priorityDiv = $(this);
                    var priorities = ["trivial", "minor", "normal", "critical", "blocker"];
                    $(priorities).each(function(i, p){
                        var set = 5 - i == thisIssue.json.priority ? " pr-" + p + "-set" : "";
                        priorityDiv.append(
                            $('<div class="pr' + (' pr-' + p) + set + '"></div>')
                            .append(
                                $('<a href="#"><i></i></a>')
                                .click(function(e){
                                    e.preventDefault();
                                    thisIssue.setPriority(5 - i);
                                })
                            )
                        );
                    });
                })
            )
            .hoverable()
        )


        .append(
            $('<td class="status"></td>')
            .append(
                $('<div class="b-status"></div>')
                .each(function(){
                    var statusDiv = $(this);

                    var statuses = {
                        '10001': "needinfo",
                        '1': "open",
                        '6': "closed",
                        '5': "closed"
                    };
                    var actions = {
                        needinfo: "31",
                        open: "91",
                        closed: "11"
                    };

                    $(["needinfo", "open", "closed"]).each(function(i, s){
                        var set = statuses[thisIssue.json.status] == s ? " st-" + s + "-set" : "";
                        statusDiv.append(
                            $('<div class="st' + (' st-' + s) + set + '"></div>')
                            .append(
                                $('<a href="#"><i></i></a>')
                                .click(function(){ thisIssue.progressWorkflowAction(actions[s]) })
                            )
                        )
                    });

                })
            )
            .hoverable()
        )

        .append($('<td class="progress"></td>'));

    if (parentNode) $(parentNode).append(tr);

    this.dom = tr;
    return tr;
};

TinyJira.Issue.prototype.createForm = function(target) {
    if (!this.dom) {
        return;
    }
    if (this.form) {
        return this.form;
    }
    var decorationTr = $('<tr class="inline-form-decoration"></tr>');

    $([1, 2, 3, 4]).each(function(i){
        decorationTr.append($('<td class="' + (i == target ? "with-inline-form" : "") + '"></td>'));
    });

    var formTr = $('<tr class="inline-form"></tr>')
        .append(
            $('<td colspan="4"></td>')
            .append(
                $('<form action="" class="g-hidden">' +
                    '<textarea style="width: 100%; height 20px;"></textarea>' +
                    '<br/><br/><input type="button" value="\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C"/> \u0438\u043B\u0438&nbsp;'
                + '</form>')
                .append(
                    $('<a href="#">\u041E\u0442\u043C\u0435\u043D\u0430</a>')
                    .click(function(){ thisIssue.hideForm() })
                )
            )
        );

    
    this.dom.addClass('with-inline-form')
        .after(formTr)
        .after(decorationTr);

    this.form = {
        decorationTr: decorationTr,
        formTr: formTr,
    };
    return form;
};

TinyJira.Issue.prototype.showForm = function(target) {
    if (!this.dom) {
        return;
    }
    this.createForm(target);
};

TinyJira.Issue.prototype.hideForm = function(target) {
    if (!this.dom) {
        return;
    }
    if (!this.form) {
        return;
    }
    delete this.form;
};

TinyJira.Issue.prototype.startProgress = function() {
    this.dom.find('td.progress').html('<span class="b-progress"><i></i></span>');
};

TinyJira.Issue.prototype.stopProgress = function() {
    this.dom.find('td.progress').html('');
};
