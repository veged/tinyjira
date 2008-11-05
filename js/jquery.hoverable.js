(function($){

$.fn.hoverable = $.fn.hoverable || function(class) {
    class = class || 'hover';
    return this.bind('mouseenter mouseleave', function(){ $(this).toggleClass(class) });
}

})(jQuery);
