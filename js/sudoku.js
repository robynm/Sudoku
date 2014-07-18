(function () {
    "use strict";

    window.SUDOKU = {
        models: {},
        views: {}
    };

    // contains an array of objects with value and isGiven properties.
    // contains methods for getting and setting object properties by array
    // index.
    SUDOKU.models.grid = function (num) {

        // declare variables
        var that,
            length,
            gridArray,
            i;

        // object to hold public methods
        that = {};

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
        var that,
            my,
            rows,
            columns,
            size,
            grid;

        // for public methods
        that = {};
        // for private methods
        my = mine || {};
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
            var section = [],
                i = 0,
                r,
                c;
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
            var startRow,
                endRow,
                startCol,
                endCol,
                region;

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
    
    // the view of a single cell of the board
    // number (value)
    // color (given or user-entered)
    // borders
    // index number (to know when to break line)
    SUDOKU.views.cell = function (cellObject, idx){
        var value = cellObject.value, // number in the cell
            constant = cellObject.isGiven, // is cell value a constant?
            location = idx; // location (index in grid) of cell
            
        // print out the value of the cell, with borders, in a different
        // color depending if it is given or not.
        
        
    };
    
    // the view of the board itself
    // different background colors for different regions
    // selected cell is in different color
    SUDOKU.views.board = function (sudokuBoard) {
        var that = {},
            hidden = {},
            board = sudokuBoard,
            size = board.getSize();
            
            that.render = function () {
                var i,
                    j;
                    
                for (i = 0; i < size; i++) {
                    for (j = 0; j < size; j++) {
                        $(".boardspace")
                        .append("<div id="+ i + j + ">" +
                        board.getValue(i,j)+ "</div>");
                    }
                }
            };
            
        return that;
    };

}());