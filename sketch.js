var User = {
	mode: 0,
	errorCount: 0,
}
var combo;
var index = 0;

function Combo(name, pattern) {
	this.name = name;
	this.pattern = pattern;
	this.timesPracticed = 0;
	this.masteryLevel = 0;
}
$(document).ready(function() {
	$(".optionButton").click(function() {
		//Hide everything
		$("#newComboDiv").css("display", "none");
		$("#practiceComboDiv").css("display", "none");
		$("#exportDataDiv").css("display", "none");
		$("#importDataDiv").css("display", "none");
		$("#deleteDataDiv").css("display", "none");
		//Reset forms
		$("#exportDataText").val('');
	});
	/* New Combination Event */
	$("#ob-new").click(function() {
		$("#newComboDiv").css("display", "inline-block");
	});
	/* New Combination Submit */
	$("#newComboForm").on("submit", function(e) {
		e.preventDefault();
		//Get the user input
		var data = $('#newComboForm').serializeArray();
		var name = data[0].value;
		//Check for validity
		if (data[0].value == "") {
			setCaretToPos(document.getElementById("ii1"), 4);
			return
		} else if (data[1].value == "") {
			setCaretToPos(document.getElementById("ii2"), 4);
			return
		}

		var comboObj = {
			name: name,
			combo: data[1].value
		}

		//Save to local storage
		dbUpdate({
			key: name,
			data: comboObj
		});
		//Clear the inputs
		$('#newComboForm')[0].reset()
		$('#combcount').html("Total: " + Object.keys(dbGetAll()).length);
		setCaretToPos(document.getElementById("ii1"), 4);
	});
	/* Pratice Button Clicked Event */
	$("#ob-practice").click(function() {
		//Create drop down menu
		$("#practiceComboDiv").css("display", "inline-block");
		var data = dbGetAll();
		var text = "<form id='comboselect' action='#'> <select name='option-name'>";
		for (var i in data) {
			var m = data[i];
			text += "<option> " + m.name + "</option>";
		}
		text += "</select>"
		text += "<br><button type='submit' value='submit' class='btn btn-success' style='width:50%' data-toggle='modal' data-target='#myModal'> Practice </button> </form>"
		$("#combo-menu").html(text);
	});
	/*Selected Practice Option */
	$("#practiceComboDiv").on("submit", "form", function(e) {
		e.preventDefault();
		$("#practice-text").html("");
		var data = $('#comboselect').serializeArray();
		if (!data[0])
			return
		var name = data[0].value;
		//Get the data using the name from local storage
		var db = dbGetAll();
		for (var n in db) {
			if (n == name) {
				var c = new Combo(db[n].name, db[n].combo);
				newPracticeSession(c);
			}
		}

		User.mode = 1;
	})
	$(document).keypress(function(event) {
		if (User.mode == 1) {
			var pressed = String.fromCharCode(event.which);
			var key = combo.pattern.split('')[index];
			if (pressed === key) {
				if (index == 0) {
					//Start timer
					startTimer();
				}
				//Correct key pressed
				index += 1;
				//Update the new string using the index
				var newText = $("#practice-text").text().split('');
				newText.shift();
				$("#practice-text").html(newText);
				if (newText.length <= 0) {
					//When the combination is done
					practiceFinished();
				}
			} else {
				//Made a mistake
				User.errorCount += 1;
			}

		}

	});
	/* Export Data */
	$("#ob-getData").click(function() {
		$("#exportDataDiv").css("display", "inline-block");

	});
	//Checkbox config wheter to enable or disable stats
	$("#exportButton").click(function() {
		if ($('#ra1').is(':checked')) {
			//Enable Stats
			var text = JSON.stringify(dbGetAll());
			$("#exportDataText").val(text);
		} else if ($('#ra2').is(':checked')) {
			//Disable Stats
			var db = dbGetAll();
			for (var i in db) {
				delete db[i]["recordMistakes"];
				delete db[i]["recordTime"];
				delete db[i]["timesPracticed"];
				delete db[i]["ml"];
			}
			var text = JSON.stringify(db);
			$("#exportDataText").val(text);
		} else {
			BootstrapDialog.show({
				message: 'Choose wheter to include stats or not'
			});
		}
	});
	/* Import Data */
	$("#ob-setData").click(function() {
		$("#importDataDiv").css("display", "inline-block");
	});
	$("#importButton").click(function() {
		var t = $("#importText").val();
		localStorage.setItem(localStorageKey, t);
		BootstrapDialog.show({
			title: 'Import Confirmation',
			message: 'Are you sure you want to import this data? All current data will be overwritten.',
			buttons: [{
				label: 'Import',
				cssClass: 'btn btn-success',
				action: function(dialog) {
					localStorage.setItem(localStorageKey, t);
					dialog.close();
				}
			}, {
				label: 'Cancel',
				cssClass: 'btn btn-warning',
				action: function(dialog) {
					dialog.close();
				}
			}]
		});
	});
	/* Manage Data */
	$("#ob-delData").click(function() {
		$("#deleteDataDiv").css("display", "inline-block");
		updateDeleteDiv();
	});
	$("#b-delete").click(function() {
		//Get the delete name
		var name = $("#manOpt").val();

		BootstrapDialog.show({
			title: 'Delete Confirmation',
			message: 'Are you sure you want to delete this?',
			buttons: [{
				label: 'Delete',
				cssClass: 'btn btn-danger',
				action: function(dialog) {
					var db = dbGetAll();
					delete db[name];
					localStorage.setItem(localStorageKey, JSON.stringify(db));
					updateDeleteDiv();
					dialog.close();
				}
			}, {
				label: 'Cancel',
				cssClass: 'btn btn-warning',
				action: function(dialog) {
					dialog.close();
				}
			}]
		});
	})
}); //End of document.ready
function updateDeleteDiv() {
	var data = dbGetAll();
	var text = "<form id='ca' action='#'> <select id='manOpt' name='option-name'>";
	for (var i in data) {
		var m = data[i];
		text += "<option> " + m.name + "</option>";
	}
	text += "</select>"
	text += "<br> </form>"
	$("#deleteDataMenu").html(text);
}

function setSelectionRange(input, selectionStart, selectionEnd) {
	if (input.setSelectionRange) {
		input.focus();
		input.setSelectionRange(selectionStart, selectionEnd);
	} else if (input.createTextRange) {
		var range = input.createTextRange();
		range.collapse(true);
		range.moveEnd('character', selectionEnd);
		range.moveStart('character', selectionStart);
		range.select();
	}
}

function setCaretToPos(input, pos) {
	setSelectionRange(input, pos, pos);
}
//Local Storage Saving and Recieving
var localStorageKey = 'c';

function dbUpdate(d) {
	//d has key, data
	var db = dbGetAll();
	db[d.key] = d.data;
	localStorage.setItem(localStorageKey, JSON.stringify(db));
}

function dbGetAll() {
	var a = localStorage.getItem(localStorageKey);
	if (a == "undefined" || a == "")
		return {};
	var db = JSON.parse(a);
	if (db) {
		return db
	}
	return {};
}

function dbGetFromKey(key) {
	//Get from key
	var db = dbGetAll();
	var e = db[key];
	if (e) {
		return e;
	}
	return
}
var startTime;

function startTimer() {
	startTime = new Date();
}

function getTimerCount() {
	var endTime = new Date();
	var difference = (endTime - startTime);
	return difference;

}
//Practice Modes
function newPracticeSession(c) {
	User = {
		mode: 1,
		errorCount: 0,
	}
	combo = c;
	$('#practice-text-title').html("Practicing " + combo.name);
	$('#practice-text').html(combo.pattern);
	// $('#practice-results').html('');
	showPracticeRecords(combo.name);
	index = 0;
}

function practiceFinished() {
	User.mode = 0;
	//Reset all lines and store results to local storage
	$('#practice-text').html('');
	$('#practice-status').html('');
	var time = getTimerCount();
	var data = dbGetFromKey(combo.name);
	if (data["timesPracticed"]) {
		data["timesPracticed"] = data["timesPracticed"] + 1;
	} else {
		data["timesPracticed"] = 1;
	}
	//Update statistics of previous results
	var res = "Previous Results:";
	res += "|  Miliseconds " + time;
	res += "| Error Count " + User.errorCount;
	res += "| Practice Session " + data["timesPracticed"];
	$('#practice-results').html(res);
	//Update data for new records
	data = updateRecordData(data, "recordMistakes", User.errorCount);
	data = updateRecordData(data, "recordTime", time);
	dbUpdate({
		key: combo.name,
		data: data
	});
	//Show Records
	showPracticeRecords(combo.name);
	//Start a new session
	newPracticeSession(combo);
}

function showPracticeRecords(name) {
	var data = dbGetFromKey(name);
	var recordsText = "Your Record:"
	if (data["recordMistakes"] === 0 || data["recordMistakes"]) {
		recordsText += " | Miliseconds " + data["recordTime"];
		recordsText += " | Error Count " + data["recordMistakes"];
	} else {
		recordsText = "No Records"
	}
	$('#practice-records').html(recordsText);

}

function updateRecordData(data, name, value) {
	var d = data;
	if (value === 0 || d[name] === 0) {
		//Know for sure that 0 is a record
		d[name] = value;
		return d;
	}
	if (!d[name]) {
		d[name] = value;
	} else if (d[name] > value) {
		d[name] = value;
	}
	return d;
}
