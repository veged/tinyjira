/**
 * JiraReport
 */
TinyJira.JiraReport = function() {
};

TinyJira.JiraReport.prototype.toDOM = function(parentNode) {
    var thisJiraReport = this,
        html = $.htmlString('div', [
            ['h2', 'Опишите проблему'],
            ['form', {action: '', method: 'post'}, [
                ['div', [
                    ['input', {name: 'summary', type: 'text', value: '', 'class': 'text', style: 'width: 100%;'}],
                    ['br'], ['br'],
                    ['textarea', {name: 'description', style: 'width: 100%; height: 100px;'}, '']
                ]],
                ['br'],
                ['input', {type: 'submit', 'class': 'submit', value: 'Сообщить'}],
                [null, ' или&nbsp;'],
                ['a', {'class': 'cancel b-pseudo-link', href: 'javascript:'}, ['span', 'Отменить']]
            ]]
        ]);

    var dom = $(html)
        .delegate('click', '.cancel', function(e){
            thisJiraReport.close();
        })
        .delegate('click', '.submit', function(e){
            e.preventDefault();
            thisJiraReport.startProgress();
            jQuery.jsonRpc({
                url: TinyJira.jira.url + 'plugins/servlet/rpc/json',
                method: 'jira.createIssue',
                params: [TinyJira.jira.auth, TinyJira.JiraReport.project, '3', {javaClass: 'java.util.HashMap', map: {
                    summary: [e.target.form.summary.value],
                    description: [e.target.form.description.value],
                    priority: ['3'],
                    assignee: ['-1'],
                    reporter: [TinyJira.user.login]
                }}, null],
                complete: function(){ thisJiraReport.stopProgress() },
                success: function(x){
                    if (!x.result) {
                        thisJiraReport.showMessage('Что-то пошло не так... попробуйте ещё раз.');
                    } else {
                        thisJiraReport.close();
                        thisJiraReport.showMessage($.htmlString([
                            [null, 'Успешно создан '],
                            ['a', {href: TinyJira.jira.url + x.result.issue.key}, x.result.issue.key],
                            [null, '.']
                        ]));
                    }
                }
            });
            return false;
        });
    thisJiraReport.dom = dom;

    if (parentNode) $(parentNode).append(dom);

    return dom;
};

TinyJira.JiraReport.prototype.showMessage = function(message) {
    this.hideMessage();
    this.dom.parents('.content').after(
        $($.htmlString('div', {'class': 'message'}, message))
    );
};

TinyJira.JiraReport.prototype.hideMessage = function() {
    this.dom.parents('.content').nextAll('.message').remove();
};

TinyJira.JiraReport.prototype.open = function() {
    this.dom.parents('.b-jira-report').addClass('b-jira-report-opened');
};

TinyJira.JiraReport.prototype.close = function() {
    this.dom.parents('.b-jira-report').removeClass('b-jira-report-opened');
};

TinyJira.JiraReport.prototype.startProgress = function() {
    this.dom.find('form')
        .hide()
        .after($('<span class="b-progress"><i></i></span>'));
};

TinyJira.JiraReport.prototype.stopProgress = function() {
    this.dom.find('form').show();
    this.dom.find('.b-progress').remove();
};

$(document).ready(function(){
    TinyJira.layout = {
        content: '.b-jira-report .content',
        sidebar: '.b-jira-report .content',
        head: '.blablabla'
    };

    TinyJira.Login.prototype.toHTML = function() {
        return $.htmlString('div', [
            ['h2', 'Введите доменный логин и пароль&hellip;'],
            ['form', {action: '', method: 'post'}, [
                ['div', [
                    ['input', {name: 'login', type: 'text', value: '', 'class': 'text', style: 'width: 100%;'}],
                    ['br'], ['br'],
                    ['input', {name: 'password', type: 'password', value: '', 'class': 'text', style: 'width: 100%;'}],
                ]],
                ['br'],
                ['input', {type: 'submit', 'class': 'submit', value: 'Войти'}],
                [null, ' или&nbsp;'],
                ['a', {'class': 'cancel b-pseudo-link', href: 'javascript:'}, ['span', 'Отменить']]
            ]]
        ]);
    };

    $('.b-jira-report')
        .each(function(){
            var params = this.onclick ? this.onclick() : {};
            TinyJira.JiraReport.project = params.project || 'NONPRJ';
            TinyJira.jira.url = params.jiraUrl || null;
        })
        .html($.htmlString('div', {'class':'h-jira-report'}, [
            ['a', {href: 'javascript:', 'class': 'b-pseudo-link report'}, [
                ['span', 'Сообщить об ошибке сразу в JIRA']
            ]],
            ['div', {'class': 'content'}]
        ]))
        .delegate('click', '.report', function(){
            $(this).parents('.b-jira-report').addClass('b-jira-report-opened');
        })
        .delegate('click', '.cancel', function(){
            $(this).parents('.b-jira-report').removeClass('b-jira-report-opened');
        });

    TinyJira.init(function(){
        $(TinyJira.layout.content).each(function(){
            (new TinyJira.JiraReport()).toDOM(this);
        });
    });
});
