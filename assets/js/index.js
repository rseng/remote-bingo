// Run when page is loaded to add tasks
$(document).ready(function() {

    var bingo = new Bingo()
    bingo.load_csv("remote-bingo.csv")

    // Function to add a new item
    $("#addButton").click(function(){
        var name = $("#newItem").val();
        menu.addItem(name);
        $.notify("Added new item " + name + " to suggestions.", "info");
    })

});
