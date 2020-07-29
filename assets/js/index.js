// Run when page is loaded to add tasks
$(document).ready(function() {

    var bingo = new Bingo()
    bingo.load_csv("remote-bingo.csv")
    bingo.add_bingo_list("bingo-lists/new-programmer.csv")
    bingo.add_bingo_list("bingo-lists/quarantine-cooking.csv")
    bingo.add_bingo_list("bingo-lists/developer.csv")
    bingo.add_bingo_list("bingo-lists/crypto-privacy.csv")
    bingo.add_bingo_list("bingo-lists/indoor-activities.csv")
    bingo.add_bingo_list("bingo-lists/virtual-conference.csv")
    bingo.add_bingo_list("bingo-lists/cookies.csv")

});
