$(function() {
	$("input[type=submit]").click(function(event) {
		event.preventDefault();
		if ($("input[name=password]").val() == $("input[name=confirm-password]").val()) {
			$(this).parent().validate();
			console.log($(this).parent().valid());
			if ($(this).parent().valid()) {
				// $(this).parent().submit();
			}
		} else {
			$("input[name=\"confirm-password\"]")[0].setCustomValidity("Passwords must match");
			$("input[name=\"confirm-password\"]")[0].reportValidity();
		}
	});
});