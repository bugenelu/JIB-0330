$(function() {
    $(".admin-toggle").click(function() {
        domain = window.location.protocol + "//" + window.location.hostname + (window.location.port == "" ? "" : ":") + window.location.port
        button = $(this);
        if (button.hasClass("fa-check-square")) {
            $.ajax({
                url: domain + "/remove_admin",
                type: "POST",
                data: $("#admin-toggle-form-" + button.attr("value")).serialize(),
                success: function() {
                    console.log("success");
                    button.removeClass("fa-check-square");
                    button.addClass("fa-square");
                }
            });
        } else {
            $.ajax({
                url: domain + "/add_admin",
                type: "POST",
                data: $("#admin-toggle-form-" + button.attr("value")).serialize(),
                success: function() {
                    console.log("success");
                    button.removeClass("fa-square");
                    button.addClass("fa-check-square");
                }
            });
        }
    })
})