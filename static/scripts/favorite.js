$(function() {
    $("#favorite").click(function() {
        domain = window.location.protocol + "//" + window.location.hostname + (window.location.port == "" ? "" : ":") + window.location.port
        if ($("#favorite").hasClass("fas")) {
            $.ajax({
                url: domain + "/remove_favorite",
                type: "POST",
                data: $("form").serialize(),
                success: function() {
                    $("#favorite").removeClass("fas")
                    $("#favorite").addClass("far")
                }
            })
        } else {
            $.ajax({
                url: domain + "/add_favorite",
                type: "POST",
                data: $("form").serialize(),
                success: function() {
                    $("#favorite").removeClass("far")
                    $("#favorite").addClass("fas")
                }
            })
        }
    })
})