class Bingo {

    // Keep record of all items, board, and selected items for cache
    items = {
        all: Array(),
        board: Array(),
        selected: Array(),

        // Bingo row, column, and diagonal indexes
        bingoRow: Array(),
        bingoCol: Array(),
        bingoDiag: Array(),
    };

    // The constructor is called when we create a Bingo object
    constructor(dim, cardId, selectedColor, selectedClass, itemClass, selectId) {
        
        // Dimension is the width and height (square)
        this.dim = dim || 5

        // Store cache (arrays of indices of diagonals)
        this.setDiagonals()
 
        // Store filenames that can be loaded here
        this.bingoLists = Array()

        // The div ids for suggestions and seen items
        this.cardId = cardId || "#card"
        this.selectId = selectId || "#selectList"
        this.selectedColor = selectedColor || "#FF0000"
        this.selectedClass = selectedClass || "selected"
        this.itemClass = itemClass || "remote-bingo-item"
        this.newCardButton = "#newCard"
        this.cleanCardButton = "#cleanCard"

        // Tell the user the chosen parameters
        this.status()

        // Event binding for buttons, setup of color picker
        $(this.newCardButton).on("click", {client: this}, this.reset);
        $(this.cleanCardButton).on("click", {client: this}, this.clear);
     
    }

    // Print a status for the user
    status() {

        console.log("itemClass: " + this.itemClass)
        console.log("cardId: " + this.cardId)
        console.log("selectedColor: " + this.selectedColor)

    }

    // Add new item if not part of board
    addItem(name) {
        if ( !(this.items.all.includes(name))) {
            console.log("Adding new item, " + name)
            this.items.all.push(name)
        }
    }

    // Choose an item (expects to be bound on click to element)
    selectItemEvent(event) {

        var name = event.target.getAttribute('data-name')
        var boxid = event.target.getAttribute('id')
        var client = event.data.client
        var items = client.items
        var index = items.selected.indexOf(name);

        // If selected, we want to unselect it
        if ($(event.target).hasClass(client.selectedClass)) {
            $(event.target).removeClass(client.selectedClass);
            $(event.target).attr("style", "");
            client.items.selected.splice(index, 1);

        // If unselected, we want to select it
        } else {
            $(event.target).attr("style", "background:" + client.selectedColor);
            $(event.target).addClass(client.selectedClass);
            client.items.selected.push(name)
        }
        client.bingoCheck()
    }

    // Reload the board
    changeBoardEvent(event) {
        var filename = $(event.target).children("option:selected").val();

        if (filename != "---") {
            var client = event.data.client
            client.items.all = Array()
            client.load_csv(filename)
            client.items.board = Array()
            client.items.selected = Array()

            // Bingo row, column, and diagonal indexes
           client.items.bingoRow = Array()
           client.items.bingoCol = Array()
           client.items.bingoDiag = Array()
           client.resetCounters()
        }
    }

    // Add a new bingo list to options
    add_bingo_list(filename) {
        this.bingoLists.push(filename)
        this.drawSelect()
    }

    // Load suggestions into the csv
    load_csv(filename) {

        filename = filename || "remote-bingo.csv";
        this.filename = filename

        // Add to filename options if not present
        if ($.inArray(filename, this.bingoLists) == -1) {
            this.bingoLists.push(filename)
        }

        var promise = new Promise(function(resolve, reject) {

            var additions = Array();
            $.get(filename, function(data) {
                data = data.split("\n").slice(1,)
                $.each(data, function(i, d){
                    var items = d.split(",")
                    if (!(items[0] === undefined) && !(items[0]=="") ) {
                        additions.push(items[0]);
                    }
                });
                resolve(additions);
            });
        });

        // Bind the class to the resolution function to add items
        promise.then(function(additions) {

            // Shuffle items on load, then add to board
            additions = this.shuffle(additions)
            for(var i = 0; i < additions.length; i++){
                this.addItem(additions[i]);    
            }
            this.update();

        }.bind(this));
    }

    // Reset Bingo and provide new board
    reset(event) {

        var client = event.data.client

        $(client.cardId).empty();
        client.items.board = Array()
        client.items.selected = Array()

        // Bingo row, column, and diagonal indexes
        client.items.bingoRow = Array()
        client.items.bingoCol = Array()
        client.items.bingoDiag = Array()
        client.items.all = client.shuffle(client.items.all)
        client.resetCounters()
        client.update()

    }

    resetCounters() {
        $('#scoreRow').html(0);
        $('#scoreCol').html(0);
        $('#scoreDiag').html(0);
    }

    // Clear card of color
    clear(event) {
        var client = event.data.client
        $("." + client.selectedClass).attr("style", "");
        $("." + client.selectedClass).removeClass(client.selectedClass);
        client.items.selected = Array();
        client.resetCounters()
    }

    // Shuffle items (used on new init or reset)
    shuffle(v) {
        for (var j, x, i = v.length; i; j = parseInt(Math.random() * i, 10), x = v[--i], v[i] = v[j], v[j] = x);
        return v;
    }

    // Draw the original board based on the dimension
    drawBoard() {
        var content = ""
        var count = 0
        for (var row = 0; row < this.dim; row++) {
            content += "<tr>\n"                
            for (var col = 0; col < this.dim; col++) {
                content += '<td id="cell' + count + '" data-name="cell' + count + '" class="' + this.itemClass + '"></td>\n'
                count += 1
            } 
            content += "</tr>\n"  
        }
        $(this.cardId).html(content)

        // Bind a change event to each added item
        $("." + this.itemClass).on('click', {client: this}, this.selectItemEvent);

    }

    drawSelect() {
        $(this.selectId).html("")
        var content = "<select><option>---</option>\n"
        for (var i = 0; i < this.bingoLists.length; i++) {
            content += "<option value='" + this.bingoLists[i] + "'>" + this.basename(this.bingoLists[i]) + "</option>\n" 
        }
        content += "</select>\n"  
        $(this.selectId).html(content)
        $(this.selectId).on('change', {client: this}, this.changeBoardEvent);
        console.log("AFTER EVENT")
        console.log(this.items.all)
    }


    // Update methods
    update() {

        // First check that we have enough items based on dimension
        var items_needed = this.dim * this.dim

        // If we don't have enough, resize board until we do
        while ((this.items.all.length < items_needed) && (this.dim >= 1)) {
            this.dim = this.dim - 1
            items_needed = this.dim * this.dim        
            console.log("Testing if we have " + items_needed + " to play bingo.")
        }
        console.log("The final board dimension is " + this.dim + " by " + this.dim + ".")

        // If we haven't filled the board, do so
        if (this.items.board.length < items_needed) {

            console.log("Resetting board to add new items.")
            while (this.items.board.length < items_needed) {
                for(var i = 0; i<this.items.all.length;i++){
                    var item = this.items.all[i];
 
                    // Add to board if not already included
                    if (!this.items.board.includes(item)) {
                        this.items.board.push(item);
                    }
                }
                this.items["selected"] = Array();
            }

            // Clear the table, prepare to add rows and colums
            $(this.cardID).html("")
            this.resetCounters()
        }

        // Add rows and columns from items
        this.drawBoard()
        this.bingoCheck()

        console.log(this.items.board);

        // Add items to board
        for (i = 0; i < items_needed; i++) {
            var squareName = "Box" + i;
            $('#cell'+i).html(this.items.board[i]).attr('title', this.items.board[i]);
        }
    }

    // Bingo Helper Functions
    containsAll(parts, array) { 
        if (parts.length == 0) {
            return false
        }
        for (var i=0; i<parts.length; i++) {
            if ($.inArray(parts[i], array) == -1) {
                return false
            }
        }
        return true
    }

    basename(path) {
        return path.split('/').reverse()[0];
    }

    // Get arrays for each diagonal in the matrix
    setDiagonals() {

        // Diagonals will be calculated and stored for later use
        this.diagonals = Object()

        var cells = this.dim * this.dim
        var leftDiagonal = Array()
        var rightDiagonal = Array()
        var idx = 0

        // Iterate through rows and columns
        for (var row = 0; row < this.dim; row ++) {
            for (var col = 0; col < this.dim; col ++) {

                // Case 1: indices are equal is top left, bottom right
                if (row == col) {
                    leftDiagonal.push("cell" + idx)
                }

                // Case 2: the col index is this.dim -1 more than the row
                if (row + col == this.dim -1) {
                    rightDiagonal.push("cell" + idx)
                }
                idx+=1
            }
        }
        this.diagonals['diag0'] = leftDiagonal
        this.diagonals['diag4'] = rightDiagonal
    }

    bingoCheck() {

        var cells = this.dim * this.dim

        // Check rows (i is an index to the start index of the row)
        for (var i = 0; i < cells + 1; i += this.dim ) {

            // Generate the row index
            var rowArray = Array()
            var start = i;
            for (var idx=i; idx<(i+this.dim); idx++){
                rowArray.push("cell"+idx)
            }

            // If all of a row's cells are selected (and if row is not added) add it
            if (this.containsAll(rowArray, this.items.selected)) {
                if ($.inArray("row"+i, this.items.bingoRow) == -1) {
                    this.items.bingoRow.push("row"+i);
                    $('#scoreRow').html(this.items.bingoRow.length);
                    $.notify("You scored a row! Don't stop now!", "info");
                }

            // If all of a row's cells are no longer selected, and if that row is in bingo array, remove it
            } else {
                if ($.inArray("row"+i, this.items.bingoRow) !== -1) {
                    this.items.bingoRow.splice($.inArray("row"+i, this.items.bingoRow), 1);
                    $('#scoreRow').html(this.items.bingoRow.length);
                }
            }
        }

        // Check columns (cells 0-20, 1-21, 2-22, 3-23, and 4-24)
        for (i = 0; i < this.dim; i++) {

            // Generate the column index
            var colArray = Array()
            for (var j=0; j<this.dim; j++){
                colArray.push("cell"+ (i+j*this.dim))
            }

           // If all of a column's cells are selected, and the column isn't already in the bingo array, add it
           if (this.containsAll(colArray, this.items.selected)) {
               if ($.inArray("col"+i, this.items.bingoCol) == -1) {
                   this.items.bingoCol.push("col"+i);
                   $('#scoreCol').html(this.items.bingoCol.length);
                   $.notify("You scored a column! Keep it up!", "primary");
               }
 
           // Otherwise if a column cells aren't selected (and it's in bingo array) remove it
           } else {
               if ($.inArray("col"+i,this.items.bingoCol) !== -1) {
                   this.items.bingoCol.splice($.inArray("col"+i, this.items.bingoCol), 1);
                   $('#scoreCol').html(this.items.bingoCol.length);
               }
           }
       }

       // Check left and right diagonals
       for (const [diagName, diagItems] of Object.entries(this.diagonals)) {
           if (this.containsAll(diagItems, this.items.selected)) {
               if ($.inArray(diagName, this.items.bingoDiag) == -1) {
                   this.items.bingoDiag.push(diagName);
                   $('#scoreDiag').html(this.items.bingoDiag.length);
                   $.notify("Bingo! You scored a diagonal! Nice moves!", "warning");
               }
           } else {
                if ($.inArray(diagName, this.items.bingoDiag) !== -1) {
                    this.items.bingoDiag.splice($.inArray(diagName, this.items.bingoDiag), 1);
                    $('#scoreDiag').html(bingoDiag.length);
                }
           }
       }

       // Check for a full bingo of all 12 row/column/diagonal combinations
       if ((this.items.bingoRow.length == this.dim) && (this.items.bingoCol.length == this.dim) && (this.items.bingoDiag.length == 2)) {
           $.notify("CONGRATULATIONS - you're a WINNER!", "success");
       }
    }
}
