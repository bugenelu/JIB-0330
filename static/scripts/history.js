var coll = document.getElementsByClassName("collapsible");

for (let i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });
}

$(function() {
	$(".preview-button").click(function() {
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
});