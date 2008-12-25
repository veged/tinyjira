/**
 * Issue
 */
TinyJira.Issue = function(json) {
    var thisIssue = this;

    this.json = json;
    this.inProgress = false;

    this.updateDefaultCallbacks = {
        beforeSend: function(x){ thisIssue.startProgress() },
        complete: function(x){ thisIssue.stopProgress() },
        success: function(x){ if (x.result) thisIssue.reinit(x.result) }
    };
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

TinyJira.Issue.prototype.setPriority = function(priority, comment) {
    this.updateWithComment({priority: String(priority)}, comment);
};

TinyJira.Issue.prototype.setStatus = function(status, comment) {
    var thisIssue = this,
        actions = TinyJira.issueActions[status]; // список действий, которые приближают к статусу (возможно нужно более одного)
    thisIssue.startProgress();

    jQuery.jsonRpc({
        url: TinyJira.jira.url + 'plugins/servlet/rpc/json',
        method: TinyJira.jira.soap + '.getAvailableActions',
        params: [TinyJira.jira.auth, thisIssue.json.key],
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
                // если достигли нужного статуса, останавливаемся и добавляем комментарий, иначе всё заново
                if (TinyJira.issueStatuses[thisIssue.json.status] == status) {
                    if (comment && comment != '') {
                        thisIssue.addComment(comment);
                    } else {
                        thisIssue.reinit();
                    }
                } else {
                    thisIssue.setStatus(status);
                }
            });
        }
    });
};

TinyJira.Issue.prototype.addComment = function(comment, callback) {
    var thisIssue = this,
        jsonRpcOptions = {
            url: TinyJira.jira.url + 'plugins/servlet/rpc/json',
            method: TinyJira.jira.soap + '.addComment',
            params: [TinyJira.jira.auth, thisIssue.json.key, {body: comment, author: TinyJira.user.login}],
            success: function(x){
                if (callback) {
                    callback.apply(this, arguments);
                } else {
                    thisIssue.reinit();
                }
            }
        };

    if (!callback) {
        thisIssue.startProgress();
        jsonRpcOptions.complete = function(){
            thisIssue.stopProgress();
            thisIssue.hideForm();
        };
    }

    jQuery.jsonRpc(jsonRpcOptions);
};

TinyJira.Issue.prototype.progressWorkflowAction = function(action, callback) {
    var thisIssue = this,
        jsonRpcOptions = {
            url: TinyJira.jira.url + 'plugins/servlet/rpc/json',
            method: TinyJira.jira.soap + '.progressWorkflowAction',
            params: [TinyJira.jira.auth, thisIssue.json.key, String(action), []],
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

TinyJira.Issue.prototype.progressWorkflowActionWithComment = function(action, comment) {
    var thisIssue = this;
    thisIssue.progressWorkflowAction(action, function(x){
        thisIssue.json = x.result;
        if (comment && comment != '') {
            thisIssue.addComment(comment);
        } else {
            thisIssue.reinit();
        }
    });
};

TinyJira.Issue.prototype.update = function(params, callbacks) {
    var soapParams = [];
    $.each(params, function(k, v){
        if (!(k == 'comment' && v == '')) {
            soapParams[soapParams.length] = {id: k, values: ($.isArray(v) ? v : [v])};
        }
    });
    var thisIssue = this,
        jsonRpcOptions = {
            url: TinyJira.jira.url + 'plugins/servlet/rpc/json',
            method: TinyJira.jira.soap + '.updateIssue',
            params: [TinyJira.jira.auth, thisIssue.json.key, soapParams],
        };

    if ($.isFunction(callbacks)) callbacks = {success: callbacks};

    if (callbacks) {
        $.extend(jsonRpcOptions, callbacks);
    } else {
        $.extend(jsonRpcOptions, thisIssue.updateDefaultCallbacks);
    }

    jQuery.jsonRpc(jsonRpcOptions);
};

TinyJira.Issue.prototype.updateWithComment = function(params, comment, callbacks) {
    var thisIssue = this;
    thisIssue.update(params, {
        success: function(x) {
            thisIssue.json = x.result;
            if (comment && comment != '') {
                thisIssue.addComment(comment);
            } else {
                thisIssue.reinit();
            }
        },
        beforeSend: thisIssue.updateDefaultCallbacks.beforeSend,
        complete: thisIssue.updateDefaultCallbacks.complete
    });
};

TinyJira.Issue.prototype.reinit = function(){
    this.hideForm();
    TinyJira.reinit.apply(this, arguments);
}

TinyJira.Issue.prototype.toDOM = function(parentNode) {
    var thisIssue = this;

    var trHTML = $.htmlString('tr', [
            ['td',
                ['a',
                    {
                        'class': 'a-key b-pseudo-link',
                        href: TinyJira.jira.url + 'browse/' + thisIssue.json.key,
                        style: 'white-space: nowrap;'
                    },
                    ['span', thisIssue.json.key]
                ]
            ],
            ['td',
                {'class': 'alltext' + (thisIssue.json.description ? ' alltext-descclosed' : '')},
                (function(){
                    var result = $.htmlString('a', {'class': 'b-issue-label summary', href: 'javascript:'}, '&ensp;' + $.htmlStringText(thisIssue.json.summary) + '&ensp;');

                    result += ' ' + $.htmlString('a', {'class':'b-issue-label assignee', title: 'Исполнитель', href: 'javascript:'}, [
                            [null, '&nbsp;&#9786;'],
                            ['span', thisIssue.json.assignee.login || thisIssue.json.assignee],
                            [null, '&ensp;']
                        ]);

                    if (thisIssue.json.components && thisIssue.json.components.length > 0) {
                        result += ' ' + $.htmlString('span', {'class':'b-issue-label components', title: 'Компоненты'}, [
                                [null, '&nbsp;&there4;'],
                                ['span', $.map(thisIssue.json.components, function(v){ return v.name }).join(', ')],
                                [null, '&ensp;']
                            ]);
                    }

                    var hasFixVersions = thisIssue.json.fixVersions && thisIssue.json.fixVersions.length > 0;
                    result += ' ' + $.htmlString('a', {
                            'class': 'b-issue-label fixversions' + (!hasFixVersions ? ' no-fixversions' : ''),
                            title: 'Версии',
                            href: 'javascript:'
                        },
                        [
                            [null, '&ensp;&beta;'],
                            (hasFixVersions ?
                                ['span', ' ' + $.map(thisIssue.json.fixVersions, function(v){ return v.name }).join(', ')] :
                                []
                            ),
                            [null, '&ensp;']
                        ]);

                    if (thisIssue.json.description) {
                        var previewLength = (function(x){
                                var y = 250, a = 10, b = 20,
                                    z = y - Math.min(x, y);
                                return Math.round( b * z/y + a );
                            })(thisIssue.json.summary.length);

                        var description = $.htmlStringText(thisIssue.json.description),
                            descriptionPreview = description.length - previewLength < 5 ? description : description.substring(0, previewLength) + '&hellip;';
                        result += ' ' + $.htmlString([
                            ['a', {'class': 'b-pseudo-link description-preview', title: 'Подробное описание'}, ['span', descriptionPreview]],
                            ['div', {'class': 'description'}, description]
                        ]);
                    }
                    return result;
                })()
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
                ['a', {'class':'b-issue-label status', title: 'Статус', href: 'javascript:'}, [
                    [null, '&ensp;'],
                    ['span', TinyJira.issueStatusTitles[TinyJira.issueStatuses[thisIssue.json.status]]],
                    [null, '&ensp;']
                ]]
//                ['div', {'class':'b-status'},
//                    $.map(['needinfo', 'open', 'closed'], function(s, i){
//                        var set = TinyJira.issueStatuses[thisIssue.json.status] == s ? ' st-' + s + '-set' : '';
//                        return [['div', {'class': 'st' + (' st-' + s) + set},
//                            ['a', {'class': 'a-st', title: TinyJira.issueStatusTitles[s], onclick: 'return \'' + s + '\'', href: 'javascript:'}, '<i></i>']
//                        ]]
//                    })
//                ]
            ],
            ['td', {'class': 'progress'}, '&nbsp;']
    ]);

    var tr = $(trHTML)
        .delegate('click', '.a-key', function(e){
            e.preventDefault();
            thisIssue.createForm(1, $.htmlString([
                    ['h3', 'Добавление комментария'],
                    ['textarea', {name: 'comment', style: 'width: 100%; height: 100px;'}]
                ]),
                function(e){ if (e.target.form.comment.value != '') thisIssue.addComment(e.target.form.comment.value) }
            );
            return false;
        })
        .delegate('click', '.a-pr', function(){
            var oldPriority = thisIssue.json.priority,
                oldPriorityName = TinyJira.issuePriorities[5 - oldPriority],
                oldPriorityTitle = TinyJira.issuePriorityTitles[oldPriorityName];
            var newPriority = this.onclick(),
                newPriorityName = TinyJira.issuePriorities[5 - newPriority],
                newPriorityTitle = TinyJira.issuePriorityTitles[newPriorityName];

            if (oldPriority == newPriority ) {
                thisIssue.hideForm();
                return false;
            }

            thisIssue.createForm(3, $.htmlString([
                    ['h3', [
                        [null, 'Изменение приоритета: '],
                        ['span', {'class': 'pr-' + oldPriorityName}, oldPriorityTitle.toLowerCase()],
                        [null, ' &rarr; '],
                        ['span', {'class': 'pr-' + newPriorityName}, newPriorityTitle.toLowerCase()],
                    ]],
                    ['textarea', {name: 'comment', style: 'width: 100%; height: 100px;'}]
                ]),
                function(e){ thisIssue.setPriority(newPriority, e.target.form.comment.value) }
            );
            return false;
        })
        .delegate('longclick', '.a-pr', function(){ thisIssue.setPriority(this.onclick()); return false; })
        .delegate('click', '.a-st', function(){
            var oldStatusName = TinyJira.issueStatuses[thisIssue.json.status],
                oldStatusTitle = TinyJira.issueStatusTitles[oldStatusName];
            var newStatusName = this.onclick(),
                newStatusTitle = TinyJira.issueStatusTitles[newStatusName];

            if (oldStatusName == newStatusName ) {
                thisIssue.hideForm();
                return false;
            }

            thisIssue.createForm(4, $.htmlString([
                    ['h3', [
                        [null, 'Изменение статуса: '],
                        ['span', {'class': 'st-' + oldStatusName}, oldStatusTitle.toLowerCase()],
                        [null, ' &rarr; '],
                        ['span', {'class': 'st-' + newStatusName}, newStatusTitle.toLowerCase()],
                    ]],
                    ['textarea', {name: 'comment', style: 'width: 100%; height: 100px;'}]
                ]),
                function(e){ thisIssue.setStatus(newStatusName, e.target.form.comment.value) }
            );
            return false;
        })
        .delegate('longclick', '.a-st', function(){ thisIssue.setStatus(this.onclick()); return false; })
        .delegate('click', '.summary', function(){
            thisIssue.createForm(2, $.htmlString([
                    ['h3', 'Изменение описания'],
                    ['input', {name: 'summary', type: 'text', value: thisIssue.json.summary, 'class': 'text', style: 'width: 100%;'}],
                    ['br'], ['br'],
                    ['textarea', {name: 'description', style: 'width: 100%; height: 100px;'}, thisIssue.json.description]
                ]),
                function(e){ thisIssue.update({
                    summary: e.target.form.summary.value,
                    description: e.target.form.description.value
                })}
            );
            return false;
        })
        .delegate('click', '.assignee', function(){
            thisIssue.createForm(1, $.htmlString([
                    ['h3', 'Изменение исполнителя'],
                    ['input', {name: 'assignee', type: 'text', value: thisIssue.json.assignee.login || thisIssue.json.assignee, 'class': 'text', style: 'width: 100%;'}],
                    ['br'], ['br'],
                    ['textarea', {name: 'comment', style: 'width: 100%; height: 100px;'}, '']
                ]),
                function(e){ thisIssue.updateWithComment(
                    {assignee: e.target.form.assignee.value},
                    e.target.form.comment.value
                )}
            );
            return false;
        })
        .delegate('click', '.fixversions', function(){
            thisIssue.startProgress();
            jQuery.jsonRpc({
                url: TinyJira.jira.url + 'plugins/servlet/rpc/json',
                method: TinyJira.jira.soap + '.getVersions',
                params: [TinyJira.jira.auth, thisIssue.json.project],
                success: function(x){
                    thisIssue.stopProgress();
                    if (x.result) {
                        thisIssue.createForm(2, $.htmlString([
                                ['h3', 'Изменение версий'],
                                ['div', $.map(x.result, function(v, i){
                                        if (v.archived) return null;
                                        var id = 'fixversion' + v.id,
                                            attributes = {
                                                id: id, name: 'fixversions', type: 'checkbox',
                                                value: v.id
                                            };
                                        if ($.map(
                                                thisIssue.json.fixVersions,
                                                function(vv){ return vv.id == v.id ? true : null}
                                            ).length > 0) attributes.checked = 'checked';
                                        return [
                                                ['input', attributes],
                                                ['label', {'for': id}, ' ' + v.name],
                                                [null, '&emsp;']
                                            ]
                                    })
                                ],
                                ['br'],
                                ['textarea', {name: 'comment', style: 'width: 100%; height: 100px;'}, '']
                            ]),
                            function(e){ thisIssue.updateWithComment(
                                {fixVersions: $.map(e.target.form.fixversions, function(i) { return i.checked ? i.value : null })},
                                e.target.form.comment.value
                            )}
                        );
                    }
                }
            });
            return false;
        })
        .delegate('click', '.status', function(){
            thisIssue.startProgress();
            jQuery.jsonRpc({
                url: TinyJira.jira.url + 'plugins/servlet/rpc/json',
                method: 'jira.getAvailableActionsWithFields',
                params: [TinyJira.jira.auth, thisIssue.json.key],
                success: function(x){
                    thisIssue.stopProgress();
                    if (x.result) {
                        thisIssue.createForm(4, $.htmlString([
                                ['h3', 'Изменение статуса'],
                                ['div', $.map(x.result, function(v, i){
                                        var id = 'action' + v.workflowAction.id,
                                            attributes = {
                                                id: id, name: 'action', type: 'radio',
                                                value: v.workflowAction.id
                                            };
                                        if (i == 0) attributes.checked = 'checked';
                                        return [
                                                ['input', attributes],
                                                ['label', {'for': id}, ' ' + v.workflowAction.name],
                                                [null, '&emsp;']
                                            ]
                                    })
                                ],
                                ['br'],
                                ['textarea', {name: 'comment', style: 'width: 100%; height: 100px;'}, '']
                            ]),
                            function(e){
                                thisIssue.progressWorkflowActionWithComment($('input[name=action]:checked').val(), e.target.form.comment.value);
                            }
                        );
                    }
                }
            });
            return false;
        })
        .delegate('click', '.description-preview', function(){
            var thisLink = $(this),
                switchedHTML = thisLink.data('switchedHTML') || $.htmlString('span', 'свернуть');
            thisLink.data('switchedHTML', thisLink.html());

            thisLink
                .html(switchedHTML)
                .parents('.alltext').toggleClass('alltext-descclosed').toggleClass('alltext-descopen');
            return false;
        });

    $().bind('TinyJira:issueShowForm', function(e, issue){ if (thisIssue != issue) thisIssue.hideForm() });

    this.dom = tr;

    if (parentNode) $(parentNode).append(tr);

    return tr;
};

TinyJira.Issue.prototype.createForm = function(target, content, onsubmit) {
    if (!this.dom) return;
    if (this.form) this.hideForm();

    var thisIssue = this;

    var decorationHTML = $.htmlString('tr', {'class': 'inline-form-decoration'}, $.map([1, 2, 3, 4], function(i){
        return [['td', {'class': (i == target ? 'with-inline-form' : '')}]];
    }));

    var formHTML = $.htmlString('tr', {'class': 'inline-form'},
        ['td', {colspan: '4'}, [
            ['form', {action: '', 'class': ''}, [
                ['div', {'class': 'content'}, content],
                ['br'],
                ['input', {type: 'submit', 'class': 'submit', value: 'Сделать'}],
                [null, ' или&nbsp;'],
                ['a', {'class': 'cancel b-pseudo-link', href: 'javascript:'}, ['span', 'Отменить']]
            ]],
        ]]
    );

    var formTr = $(formHTML),
        decorationTr = $(decorationHTML);

    thisIssue.dom.addClass('with-inline-form')
        .after(formTr)
        .after(decorationTr);

    var tr = $(formTr)
        .delegate('click', '.submit', function(e){
            e.preventDefault();
            onsubmit.apply(this, arguments);
            return false;
        })
        .delegate('click', '.cancel', function(e){ e.preventDefault(); thisIssue.hideForm(target); return false; })
        .find("input[type='text'], textarea, select").eq(0).focus();

    thisIssue.form = {
        decorationTr: decorationTr,
        formTr: formTr,
    };

    $().trigger('TinyJira:issueShowForm', [thisIssue]);

    return thisIssue.form;
};

TinyJira.Issue.prototype.hideForm = function() {
    if (!this.dom || !this.form) return;
    $.each(this.form, function(){
        var f = this;
        f.hide();
        setTimeout(function(){f.remove()}, 1);
    });
    this.dom.removeClass('with-inline-form');

    delete this.form;
};

TinyJira.Issue.prototype.disableForm = function() {
    if (!this.dom || !this.form) return;
    this.form.formTr.find('input, select, textarea').attr('disabled', 'disabled');
};

TinyJira.Issue.prototype.enableForm = function() {
    if (!this.dom || !this.form) return;
    this.form.formTr.find('input, select, textarea').removeAttr('disabled');
};

TinyJira.Issue.prototype.toggleForm = function(target, content, onsubmit) {
    if (!this.dom) return;
    if (this.form) {
        this.hideForm();
    } else {
        this.createForm(target, content, onsubmit);
    }
};

TinyJira.Issue.prototype.startProgress = function() {
    this.disableForm();
    if (this.inProgress) return;
    this.inProgress = true;
    this.dom.find('td.progress').html('<span class="b-progress"><i></i></span>');
};

TinyJira.Issue.prototype.stopProgress = function() {
    this.enableForm();
    this.dom.find('td.progress').html('');
};
