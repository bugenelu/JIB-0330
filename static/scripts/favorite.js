$("#favorite").click(
    function() {
        if ($("#favorite").hasClass("fas")) {
            // Make it not solid
            $.ajax({
                url: "https://gaknowledgehub.web.app/remove_favorite",
                type: "POST",
                data: $("form").serialize(),
                success: function() {
                    $("#favorite").removeClass("fas")
                    $("#favorite").addClass("far")
                }
            })
        } else {
            $.ajax({
                url: "https://gaknowledgehub.web.app/add_favorite",
                type: "POST",
                data: $("form").serialize(),
                success: function() {
                    $("#favorite").removeClass("far")
                    $("#favorite").addClass("fas")
                }
            })
        }
    }
)