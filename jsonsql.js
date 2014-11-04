var jsonsql = function(jsonObject) {
	this.db = jsonObject;
};

/**
 * Perform a sql like query on a JSON object
 * @param  {String | Array} columns columns to be queried on
 * user can pass '*' which means select all properties
 * user can pass a single string denoting the property in an object
 * user can pass a list of strings, denoting multiple properties in an object
 * column names can be json paths to accomodate scenarios where user wants to query nested objects
 * @param  {String} tablePath   json path that must be queried
 * @return {Array}
 */
jsonsql.Prototype.query = function(columnNames, tablePath) {
	var table = jsonUtils.getJsonNode(this.db, tablePath),
		columns, queryResult;
	
	//check if the table exists in the json object
	if (!this.isTableQueryable(table)) {
		console.log('tablepath cannot be queried');
		return;
	}

	columns = this.getColumnNames(columnNames, table);

	//column names are not valid
	if (columns.length === 0) {
		return;
	}
	
	//if table is array return array
	if (_.isArray(table)) {
		queryResult = [];
		_.each(table, function(tableRow) {
			queryResult.push(_.pick(tableRow, columns));
		});
	} else {
		queryResult = _.pick(table, columns);
	}
	return queryResult;
};

/**
 * checks if a table can be queried
 * a table can be queried only if
 * a. it is not undefined
 * b. it is not a function
 * c. it is an array or an object
 * @param  table 
 * @return {Boolean}
 */
jsonsql.Prototype.isTableQueryable = function(table) {
	return (!_.isUndefined(table) && !_.isFunction(table) && (_.isArray(table) || _.isObject(table)));
};

/**
 * gets the list of columns to query on
 * @param  {String | Array} columnNames
 * @param  {Object | Array} table
 * @return {Array} columnNames
 */
jsonsql.Prototype.getColumnNames = function(columnsList, table) {
	var columns = [], tableObj, 
	if (_.isArray(table)) {
		tableObj = table[0];
	}

	if(_.isString(columnsList)) {
		if(columnsList === '*') {
			return _.keys(tableObj);
		} else if (columnsList.indexOf(",") !== -1) {
			//accomodate the case where user gives column names as strings delimited by commas
			columns = columnsList.split(","); 
		}
	} else if(_.isArray(columnsList)) {
		columns = columnsList;
	}

	//check if columns are valid
	var isValidColumn = this.isValidColumn(columns, tableObj);

	if (isValidColumn) {
		return columns;
	} else {
		return [];
	}
};

/**
 * validate column names
 * a column name is valid if
 * a. if the column is a propertyName and the propertyName exists in the object
 * b. if the column is a jsonPath and the jsonPath is not undefined and does not point in turn to an array or an object
 * @param  {Array} columns 
 * @param  {Object} tableObj
 * @return {Boolean}
 */
jsonsql.Prototype.isValidColumn = function(columns, tableObj) {
	var isValidColumn = true, columnName, valueObj;
	
	for (var i = 0; i < columns.length; i++) {
		columnName = columns[i];
		//check for undefined, null,empty
		if(_.isUndefined(columnName) || _.isNull(columnName) || _.isEmpty(columnName)) {
			isValidColumn = false;
			break;
		}
		//if a column name is a json path, make sure
		//a. the path is correct
		//b. the path does not lead to array or an object or a function
		if (jsonUtils.isJsonPath(columnName)) {
			valueObj = jsonUtils.getJsonNode(columnName, tableObj);
			if(_.isUndefined(valueObj) || _.isFunction(valueObj) || _.isArray(valueObj) || _.isObject(valueObj)) {
				isValidColumn = false;
				break;
			}
		} else if (!_.has(tableObj, columnName)){
			//if a column name is a string, see if the property exists on the object
			isValidColumn = false;
			break;
		}	
	}

	if(!isValidColumn) {
		//log error for columnName
		console.log('Column name: ' + columnName + ' is not valid');
	}
	return isValidColumn;
};



var jsonUtils = function() {

	/**
     * Check if a particular json path is valid and returns value if valid else return nothing
     * @param {Object} obj
     * @param {String} path
     * @return {Array|Object|null}
     */
    this.getJsonNode: function(obj, path) {
        var args = path.split('.');
        for (var i = 0; i < args.length; i++) {
            if (_.isNull(obj) || _.isUndefined(obj) || !obj.hasOwnProperty(args[i])) {
                return;
            }
            obj = obj[args[i]];
        }
        return obj;
    },

    /**
     * tells if a string is a json path
     * @param  {String}  jsonPath
     * @return {Boolean}
     */
    this.isJsonPath: function(jsonPath) {
    	return jsonPath.indexOf(".") !== -1;
    }
};