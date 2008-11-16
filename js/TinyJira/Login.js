/**
 * Login
 */
TinyJira.Login = function() {
};

TinyJira.Login.prototype.toDOM = function(parentNode) {
    var thisLogin = this,
        html = $.htmlString('div', [
            ['h2', 'Вы не авторизованы&hellip;'],
            ['form', {action: '/login.jsp', method: 'post'}, [
                ['label', [
                    [null, 'Логин: '],
                    ['input', {name: 'os_username', type: 'text', size: '25', value: ''}]
                ]],
                [null, '&nbsp; '],
                ['label', [
                    [null, 'Пароль: '],
                    ['input', {name: 'os_password', type: 'password', size: '25', value: ''}]
                ]],
                [null, '&nbsp; '],
                ['input', {name: 'os_cookie', type: 'hidden', value: 'true'}],
                ['input', {name: 'os_destination', type: 'hidden', value: location.href}],
                ['input', {type: 'submit', value: 'Войти'}],
            ]]
        ]);

    var dom = $(html);
    thisLogin.dom = dom;

    if (parentNode) $(parentNode).append(dom);
    
    return dom;
};
