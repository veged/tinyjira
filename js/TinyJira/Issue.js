/**
 * Issue
 */
TinyJira.Issue = function(json) {
    this.json = json;
};

TinyJira.issueStatuses = {
    '10001': 'needinfo',
    '1': 'open',
    '6': 'closed',
    '5': 'closed'
};

TinyJira.issueActions = {
    needinfo: {
        '31': '31',
        '91': '91',
        '21': '21'
    },
    open: {
        '41': '41',
        '91': '91',
        '21': '21'
    },
    closed: {
        '121': '121',
        '81': '81',
        '11': '11'
    }
};

TinyJira.issueStatusTitles = {
    'needinfo': 'Нуждается в дополнении',
    'open': 'Открыто',
    'closed': 'Закрыто'
};

TinyJira.issuePriorities = ['trivial', 'minor', 'normal', 'critical', 'blocker'];

TinyJira.issuePriorityTitles = {
    'trivial': 'Совсем неважно',
    'minor': 'Неважно',
    'normal': 'Нормально',
    'critical': 'Важно',
    'blocker': 'Очень важно'
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
            thisIssue.reinit(x.result.issue);
        }
    });
};

TinyJira.Issue.prototype.setStatus = function(status) {
    var thisIssue = this,
        actions = TinyJira.issueActions[status]; // список действий, которые приближают к статусу (возможно нужно более одного)
    thisIssue.startProgress();

    jQuery.jsonRpc({
        url: TinyJira.jira.url + '/plugins/servlet/rpc/json',
        method: TinyJira.jira.soap + '.getAvailableActions',
        params: [null, thisIssue.json.key],
        success: function(x){
            var action;
            $.each(x.result, function(){
                action = actions[this.id];
                if (action) return false;
            });

            if (!action) {
                // останавливаемся, поскольку неизвестно с помощью какого действия можно приблизиться к статусу
                thisIssue.stopProgress();
                return false
            };

            thisIssue.progressWorkflowAction(action, function(x){
                thisIssue.json = x.result;
                // если достигли нужного статуса, останавливаемся, иначе всё заново
                if (TinyJira.issueStatuses[thisIssue.json.status] == status) {
                    thisIssue.reinit();
                } else {
                    thisIssue.setStatus(status);
                }
            });
        }
    });
};

TinyJira.Issue.prototype.progressWorkflowAction = function(action, callback) {
    var thisIssue = this,
        jsonRpcOptions = {
            url: TinyJira.jira.url + '/plugins/servlet/rpc/json',
            method: TinyJira.jira.soap + '.progressWorkflowAction',
            params: [null, thisIssue.json.key, String(action), []],
            success: function(x){
                if (callback) {
                    callback.apply(this, arguments);
                } else {
                    thisIssue.reinit(x.result);
                }
            }
        };

    if (!callback) {
        thisIssue.startProgress();
        jsonRpcOptions.complete = function(){ thisIssue.stopProgress() };
    }

    jQuery.jsonRpc(jsonRpcOptions);
};

TinyJira.Issue.prototype.reinit = TinyJira.reinit;

TinyJira.Issue.prototype.update = function(fieldValues) {
    var thisIssue = this;
    thisIssue.startProgress();
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

TinyJira.Issue.prototype.toDOM = function(parentNode) {
    var thisIssue = this;

    var trHTML = $.htmlString('tr', [
            ['td',
                ['a',
                    {
                        href: TinyJira.jira.url + 'browse/' + thisIssue.json.key,
                        style: 'white-space: nowrap;'
                    },
                    thisIssue.json.key
                ]
            ],
            ['td',
                {'class': 'alltext' + (thisIssue.json.description ? ' alltext-descclosed' : '')},
                [
                    ['div', {'class':'summary'}, String(thisIssue.json.summary)],
                    (thisIssue.json.description ? ['div', {'class':'description'}, String(thisIssue.json.description)] : [])
                ]
            ],
            ['td', {'class': 'priority'},
                ['div', {'class':'b-priority'},
                    $.map(TinyJira.issuePriorities, function(p, i){
                        var set = 5 - i == thisIssue.json.priority ? ' pr-' + p + '-set' : '';
                        return [['div', {'class': 'pr' + (' pr-' + p) + set},
                            ['a', {'class': 'a-pr', title: TinyJira.issuePriorityTitles[p], onclick: 'return ' + (5 - i), href: 'javascript:'}, '<i></i>']
                        ]]
                    })
                ]
            ],
            ['td', {'class': 'status'},
                ['div', {'class':'b-status'},
                    $.map(['needinfo', 'open', 'closed'], function(s, i){
                        var set = TinyJira.issueStatuses[thisIssue.json.status] == s ? ' st-' + s + '-set' : '';
                        return [['div', {'class': 'st' + (' st-' + s) + set},
                            ['a', {'class': 'a-st', title: TinyJira.issueStatusTitles[s], onclick: 'return \'' + s + '\'', href: 'javascript:'}, '<i></i>']
                        ]]
                    })
                ]
            ],
            ['td', {'class': 'progress'}]
    ]);

    var tr = $(trHTML)
        .delegate('click', '.a-pr', function(){ thisIssue.setPriority(this.onclick()); return false; })
        .delegate('click', '.a-st', function(){ thisIssue.setStatus(this.onclick()); return false; })
        .delegate('click', '.alltext-descclosed, .alltext-descopen', function(){ $(this).toggleClass('alltext-descclosed').toggleClass('alltext-descopen'); return false; });

    this.dom = tr;

    if (parentNode) $(parentNode).append(tr);

    return tr;
};

TinyJira.Issue.prototype.toDOM2 = function(parentNode) {
    var thisIssue = this;
    var trHTML = '<tr>' +
        '<td><a' +
            ' href="' + TinyJira.jira.url + 'browse/' + thisIssue.json.key + '"' +
            ' style="white-space: nowrap;">' +
                thisIssue.json.key +
        '</a></td>';

    trHTML += '<td class="alltext' + (thisIssue.json.description ? ' alltext-descclosed' : '') + '">' +
            '<div class="summary">' + String(thisIssue.json.summary) + '</div>';
    if (thisIssue.json.description) {
        trHTML += '<div class="description">' + String(thisIssue.json.description) + '</div>';
    }
    trHTML += '</td>';

    trHTML += '<td class="priority">' +
        '<div class="b-priority">';
    var priorities = ["trivial", "minor", "normal", "critical", "blocker"];
    $(priorities).each(function(i, p){
        var set = 5 - i == thisIssue.json.priority ? " pr-" + p + "-set" : "";
        trHTML += '<div class="pr' + (' pr-' + p) + set + '"><a class="a-pr" href="javascript:" onclick="return ' + (5 - i) + '"><i></i></a></div>'
    });
    trHTML += '</div>' +
        '</td>';

    trHTML += '<td class="status">' +
        '<div class="b-status">';
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
        trHTML += '<div class="st' + (' st-' + s) + set + '"><a class="a-st" href="javascript:" onclick="return ' + actions[s] +'"><i></i></a></div>'
    });
    trHTML += '</div>' +
        '</td>';

    trHTML += '<td class="progress"></td>' +
        '</tr>';
    var tr = $(trHTML)
        .delegate('click', '.a-pr', function(){ thisIssue.setPriority(this.onclick()); return false; })
        .delegate('click', '.alltext-descclosed, .alltext-descopen', function(){ $(this).toggleClass('alltext-descclosed').toggleClass('alltext-descopen'); return false; });

    this.dom = tr;

    if (parentNode) $(parentNode).append(tr);

    return tr;
};

TinyJira.Issue.prototype.toDOM1 = function(parentNode) {
    var thisIssue = this;
    var tr = $(document.createElement('tr'))
        .append(
            $('<td><a' +
                ' href="' + TinyJira.jira.url + 'browse/' + this.json.key + '"' +
                ' style="white-space: nowrap;">' +
                    this.json.key +
            '</a></td>')
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
                                $('<a href="javascript:"><i></i></a>')
                                .click(function(e){
                                    e.preventDefault();
                                    thisIssue.setPriority(5 - i);
                                })
                            )
                        );
                    });
                })
            )
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
                                $('<a href="javascript:"><i></i></a>')
                                .click(function(){ thisIssue.progressWorkflowAction(actions[s]) })
                            )
                        )
                    });

                })
            )
        )

        .append($('<td class="progress"></td>'));

    this.dom = tr;

    if (parentNode) $(parentNode).append(tr);

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
                    $('<a href="javascript:">\u041E\u0442\u043C\u0435\u043D\u0430</a>')
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
