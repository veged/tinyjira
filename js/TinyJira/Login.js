/**
 * Login
 */
TinyJira.Login = function() {
    var thisLogin = this;
    $().bind('TinyJira:login', function(e, auth){
        thisLogin.dom.hide();
        setTimeout(function(){thisLogin.dom.remove()}, 1);
    });
};

TinyJira.Login.prototype.toHTML = function() {
    return $.htmlString('div', [
        ['h2', 'Вы не авторизованы&hellip;'],
        ['form', {action: '', method: 'post'}, [
            ['label', [
                [null, 'Логин: '],
                ['input', {name: 'login', type: 'text', size: '25', value: ''}]
            ]],
            [null, '&nbsp; '],
            ['label', [
                [null, 'Пароль: '],
                ['input', {name: 'password', type: 'password', size: '25', value: ''}]
            ]],
            [null, '&nbsp; '],
            ['input', {type: 'submit', 'class': 'submit', value: 'Войти'}],
        ]]
    ]);
};

TinyJira.Login.prototype.toDOM = function(parentNode) {
    var thisLogin = this,
        html = thisLogin.toHTML();

    var dom = $(html)
        .delegate('click', '.submit', function(e){ 
            e.preventDefault();
            thisLogin.startProgress();
            jQuery.jsonRpc({
                url: TinyJira.jira.url + 'plugins/servlet/rpc/json',
                method: 'jira.login',
                params: [e.target.form.login.value, e.target.form.password.value],
                complete: function(){ thisLogin.stopProgress() },
                success: function(x){
                    if (!x.result) {
                        thisLogin.showMessage('Что-то пошло не так... попробуйте ещё раз.');
                    } else {
                        $().trigger('TinyJira:login', [x.result]);
                    }
                }
            });
            return false;
        });
    thisLogin.dom = dom;

    if (parentNode) $(parentNode).append(dom);

    return dom;
};

TinyJira.Login.prototype.showMessage = function(message) {
    this.hideMessage();
    this.dom.find('form').after(
        $($.htmlString('div', {'class': 'message'}, message))
    );
};

TinyJira.Login.prototype.hideMessage = function() {
    this.dom.find('.message').remove();
};

TinyJira.Login.prototype.startProgress = function() {
    this.dom.find('form')
        .hide()
        .after($('<span class="b-progress"><i></i></span>'));
};

TinyJira.Login.prototype.stopProgress = function() {
    this.dom.find('form').show();
    this.dom.find('.b-progress').remove();
};
