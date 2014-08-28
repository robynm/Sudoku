(function () {
    "use strict";

    window.SUDOKU = {
        controllers: {},
        models: {},
        views: {}
    };

    // contains an array of objects with value and isGiven properties.
    // contains methods for getting and setting object properties by array
    // index.
    SUDOKU.models.grid = function (num) {

        // declare variables
        var gridArray,
            i,
            length,
            that = {}; // object to hold public methods

        // instance variables
        length = num * num;
        gridArray = [];

        // default values for each cell
        for (i = 0; i < length; i++) {
            gridArray[i] = {value: 0, isGiven: false};
        }

        // public methods

        that.getValue = function (idx) {
            return gridArray[idx].value;
        };
        that.setValue = function (idx, val) {
            gridArray[idx].value = val;
            return this;
        };
        that.isGiven = function (idx) {
            return gridArray[idx].isGiven;
        };
        that.setGiven = function (idx) {
            gridArray[idx].isGiven = true;
            return this;
        };

        return that;
    };

    // holds the row and column number of the sudoku board, and accesses the
    // board properties by row and column index.
    // can evaluate rows, columns and regions of the board to determine if they
    // contain blanks or errors.
    SUDOKU.models.board = function (rw, cl, mine) {
        // declare variables
        var columns,
            grid,
            my = mine || {}, // for private methods
            rows,
            size,
            that = {}; // for public methods
            

        // instance variables
        rows = rw;
        columns = cl;
        size = rows * columns;

        // create a new collection of cell values
        grid = SUDOKU.models.grid(size);

        // private methods

        // translate row and column number into index of grid
        my.getIndex = function (r, c) {
            // catch error - r or c is out of bounds
            if (r < 0 || r >= size || c < 0 || c >= size) {
                return "ERROR - index out of bounds";
            }

            return r * size + c;
        };

        // given starting and ending row and column numbers,
        // return an array with the indices of those coordinates
        // in the grid collection
        my.getIndices = function (startR, endR, startC, endC) {
            var c,
                i = 0,
                r,
                section = [];
                
            while (i < size) {
                for (r = startR; r <= endR; r++) {
                    for (c = startC; c <= endC; c++) {
                        section[i] = my.getIndex(r, c);
                        i++;
                    }
                }
            }
            return section;
        };

        // given an array of indices, check the values of the object at each
        // index
        // if there are duplicates, return "error"
        // if there are no duplicates but are blanks (0), return "incomplete"
        // if there are no duplicates or blanks return "complete"
        my.checkState = function (arr) {

            var empty = false,
                i,
                j;

            for (i = 0; i < arr.length - 1; i++) {
                for (j = i + 1; j < arr.length; j++) {
                    // check every value for 0's
                    if (grid.getValue(arr[i]) === 0 ||
                            grid.getValue(arr[j]) === 0) {
                        empty = true;
                        // check for duplicate, non-zero values
                    } else if (grid.getValue(arr[i]) ===
                            grid.getValue(arr[j])) {
                        // return at first error
                        return "error";
                    }
                }
            }

            // if we made it this far there are no errors
            if (empty) {
                return "incomplete";
            } // else
            return "complete";
        };

        // public methods
        
        that.getRows = function () {
            return rows;
        };
        
        that.getColumns = function () {
            return columns;
        };
        
        that.getSize = function () {
            return size;
        };
        
        that.isGiven = function (r, c) {
            return grid.isGiven(my.getIndex(r,c));
        };

        // return the value of the object at the index that
        // corresponds to the row and column parameters
        that.getValue = function (r, c) {

            return grid.getValue(my.getIndex(r, c));
        };

        // set object value
        that.setValue = function (r, c, val) {
            var idx;

            // catch error - val is out of range
            if (val < 0 || val > size || typeof val !== "number") {
                return "ERROR - illegal value: " + val;
            }

            idx = my.getIndex(r, c);

            // catch error - object is given
            if (grid.isGiven(idx)) {
                return "ERROR - cannot set given location: " + r + "," + c;
            }

            grid.setValue(idx, val);
            return this;
        };

        // set the isGiven property on all objects with non-zero value to true
        that.fixGivens = function () {
            var i;

            for (i = 0; i < size * size; i++) {
                if (grid.getValue(i)) {
                    grid.setGiven(i);
                }
            }
            return this;
        };

        // get the state of a given row n (valid values 0 => size-1)
        that.getRowState = function (n) {
            var row;

            // catch error -- n is out of range
            if (n < 0 || n >= size) {
                return "ERROR - out of bounds: " + n;
            }

            row = my.getIndices(n, n, 0, size - 1);
            return my.checkState(row);
        };

        // get the state of a given column n (valid values 0 => size-1)

        that.getColumnState = function (n) {
            var col;

            // catch error -- n is out of range
            if (n < 0 || n >= size) {
                return "ERROR - out of bounds: " + n;
            }

            col = my.getIndices(0, size - 1, n, n);
            return my.checkState(col);
        };

        // get the state of a given region n (valid values 0 => size-1)

        that.getRegionState = function (n) {
            var endCol,
                endRow,
                region,
                startCol,
                startRow;

            // catch error -- n is out of range
            if (n < 0 || n >= size) {
                return "ERROR - out of bounds: " + n;
            }

            startRow = Math.floor(n / rows) * rows;
            endRow = startRow + rows - 1;
            startCol = (n % rows) * columns;
            endCol = startCol + columns - 1;

            region = my.getIndices(startRow, endRow, startCol, endCol);

            return my.checkState(region);
        };

        // a 2-D string representation of the grid values

        that.toString = function () {
            var stringBoard = "",
                i,
                j;

            for (i = 0; i < size; i++) {
                stringBoard += "\n";

                for (j = 0; j < size; j++) {
                    stringBoard += that.getValue(i, j) + " ";
                }
            }
            return stringBoard;
        };

        return that;
    };
    
    // the view of the board itself
    // different background colors for different regions
    // selected cell is in different color
    SUDOKU.views.board = function (sudokuBoard) {
        var board = sudokuBoard,
            selected = [0,0],
            size = board.getSize(),
            that = {};
            
            that.render = function () {
                var bkgrnd,
                    color,
                    flag,
                    i,
                    id,
                    j,
                    val;
                
                // clear previous board
                $(".boardspace").empty();
                
                    
                for (i = 0; i < size; i++) {
                    flag = !flag;
                    // flip flag at each change in region
                    // color changes at end of each region for boards with odd #
                    // of rows
                    if (i % board.getRows() === 0 && board.getRows() % 2 !== 0)
                    {
                        flag = !flag;
                    // color changes at end of each row for boards with even #
                    // of rows
                    } else if (i % board.getRows() !== 0 &&
                            board.getRows() % 2 === 0) {
                                flag = !flag;
                            }
                    for (j = 0; j < size; j++) {
                        val = board.getValue(i,j);
                        color = board.isGiven(i,j) ? "black" : "blue";
                        if (!val) {
                            val = "";
                        }
                        // change color each time column gets to a new region
                        if (j % board.getColumns() === 0 ) {
                            flag = !flag;
                        }
                        if (i === selected[0] && j === selected[1]) {
                            bkgrnd = "selected";
                        } else if (flag) {
                            bkgrnd = "dark";
                        } else {
                            bkgrnd = "light";
                        }
                        
                        id  = "" + i + j;
                        
                        $(".boardspace")
                        .append("<div id="+ id + "> <span>" +
                        val + "</span></div>");
                        $("#"+ id).addClass(bkgrnd).css("color",  color)
                        .on("click", SUDOKU.controllers.cellHandler);
                    }
                    $(".boardspace").append("<br>");
                }
            };
            
            that.setSelected = function (r, c) {
                if (r < 0) {
                    r = 0;
                } else if (r >= size) {
                    r = size-1;
                }
                if (c < 0) {
                    c = 0;
                } else if (c >= size) {
                    c = size-1;
                }
                selected[0] = r;
                selected[1] = c;
            };
            
            that.getSelectedRow = function () {
                return selected[0];
            };
            
            that.getSelectedCol = function () {
                return selected[1];
            };
            
        return that;
    };
    
    // An event handler to change the selected cell to target cell on
    // mouse click
    SUDOKU.controllers.cellHandler = function (e) {
        var col,
            row;
        
        row = parseInt(e.currentTarget.id[0]);
        col = parseInt(e.currentTarget.id[1]);
        view.setSelected(row, col);
        view.render();
    };
    
    // Updates the Sudoku view based on keyboard events
    SUDOKU.controllers.keyHandler = function (e) {
        var c,
            r;
            
        console.log(e);
            
        r = view.getSelectedRow();
	    c = view.getSelectedCol();
	    
	    // change selection with arrow keys
	    switch (e.keyCode) {
	       case 37: // left
	            view.setSelected(r, c-1);
	            view.render();
	            break;
	       case 38: // up
	            view.setSelected(r-1, c);
	            view.render();
	            break;
	       case 39: // right
                view.setSelected(r, c+1);
	            view.render();
	            break;
	       case 40: // down
	            view.setSelected(r+1, c);
	            view.render();
	           break;
	    }
	    
	   // change value with number keys
	   if (e.keyCode >= 48 && e.keyCode <= 57) {
	       board.setValue(r, c, parseInt(e.keyCode)-48);
	       view.render();
	   } else if ( e.keyCode >= 96 && e.keyCode <= 105) {
	          
	       board.setValue(r, c, parseInt(e.keyCode)-(48 * 2));
	       view.render();
	   }
    };

    
    SUDOKU.controllers.buttonHandler = function (e) {
        
        // private methods
        
        var getColor = function (state) {
            var color = "#5e69ff";
            switch (state) {
                case "complete":
                    color = "#40c752"; // green
                    break;
                case "incomplete":
                    color = "#d1d111"; // yellow
                    break;
                case "error":
                    color = "#ff6b6b"; // red
                    break;
            }
            return color;
        };
        
        var hasErrors = function (b) {
            var size = b.getSize();
            var errors = false;
            var row,
                col,
                reg;
            
            for (var i = 0; i < size; i++) {
                row = b.getRowState(i);
                col = b.getColumnState(i);
                reg = b.getRegionState(i);
                if (row === "error" || col === "error" || reg === "error") {
                    errors = true;
                }
            }
            
            return errors;
        };
    
        if (e.target.innerHTML === "Enter Values"){
            
            var r = parseInt($("select.row").val());
            var c = parseInt($("select.column").val());
            
            // create new global variables for board and view
            window.board = SUDOKU.models.board(r,c);
            window.view = SUDOKU.views.board(board);
            view.render();
            
            // change button text to "Begin Playing"
            $(".button").html("Begin Playing");
            
            // change subtitle to "enter given values"
            $(".mode h3").html("enter given values");
            
        } else if (e.target.innerHTML === "Begin Playing") {
            // check for errors in givens
            if (hasErrors(board)) {
                $(".boardspace h3").empty();
                $(".boardspace").append("<h3>fix errors before proceeding</h3>")
            } else {
                board.fixGivens();
            
                // change button text to "Check Answers"
                $(".button").html("Check Answers");
            
                $(".mode").css("border", "none");
                $(".mode h2").empty();
                $(".mode h3").empty();
                view.render();
            }
            
        } else if (e.target.innerHTML === "Check Answers") {
            var size = board.getSize();
            
            $(".answers").empty();
            
            for (var i = 0; i < size; i++) {
                
                var rState = board.getRowState(i);
                var cState = board.getColumnState(i);
                var regState = board.getRegionState(i);
                var rColor = getColor(rState);
                var cColor = getColor(cState);
                var regColor = getColor(regState);
                
                $(".answers").append("<div> Row " + (i+1) + " status: " + rState
                + "</div>");
                $(".answers div").last().css("color", rColor);
                
                $(".answers").append("<div> Column " + (i+1) + " status: " +
                cState + "</div>");
                $(".answers div").last().css("color", cColor);
                
                $(".answers").append("<div> Region " + (i+1) + " status: " +
                regState + "</div>");
                $(".answers div").last().css("color", regColor);
            }
        }
    };
    
}());