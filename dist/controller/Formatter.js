sap.ui.define(function() {
	"use strict";

	return {
		displayDate: function(fValue) {
			var month;
			console.log(fValue);
			fValue = fValue.split("-");
			switch (fValue[1]) {
				case "01": month = "ene.";
					break;
				case "02": month = "feb.";
					break;
				case "03":month = "mar.";
					break;
				case "04":month = "abr.";
					break;
				case "05":month = "may.";
					break;
				case "06":month = "jun.";
					break;
				case "07":month = "jul.";
					break;
				case "08":month = "ago.";
					break;
				case "09":month = "sept.";
					break;
				case "10":month = "oct.";
					break;
				case "11":month = "nov.";
					break;
				case "12":month = "dic.";
					break;
			}
			return fValue[0] + " " + month + " " + fValue[2];
			/*var date = new Date(fValue);
			
			var datepicker = new sap.m.DatePicker();
			datepicker.setValueFormat("dd-MM-yy");
			datepicker.setDateValue(new Date(date));
			return datepicker.getValue(); */
		}
	};

}, /* bExport= */ true);