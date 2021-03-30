$(function() {
	$(".preview-button").click(function(e) {
        e.stopPropagation();
		$("#preview-" + $(this).attr("value")).show();
	});
	$(".preview-nav").click(function() {
        if (!($(this).hasClass("disabled"))) {
    		$("#preview-" + $(this).attr("value")).show();
    		$(this).parent().hide();
        }
	});
    $(".preview-close").click(function() {
        $(this).parent().hide();
    });
    $(".collapsible").click(function() {
        if ($(this).next().is(":visible")) {
            $(this).next().hide();
        } else {
            $(this).next().show();
        }
    });
});