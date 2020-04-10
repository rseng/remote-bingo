// Run when page is loaded to add tasks
$(document).ready(function() {

    var bingo = new Bingo()
    bingo.load_csv("remote-bingo.csv")
    // under development, adding a custom list
    //bingo.add_bingo_list("bingo-lists/new-programmer.csv")

});
