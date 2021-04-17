$(function() {
	$(".delete-file-button").click(function() {
		if (confirm("Are you sure you want to delete " + $(this).attr("value") + "?")) {
			window.location.href = $(this).attr("target");
		}
	});
});