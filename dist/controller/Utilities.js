sap.ui.define([
	"sap/m/Dialog",
	'sap/m/Button',
	'sap/m/Text'
], function(Dialog, Button, Text) {
	"use strict";
	
	var Utilities = {
		messageDialogCreator: function(dtitle, dmessage) {
			var dialog = new Dialog({
				title: dtitle,
				type: 'Message',
				content: new Text({
					text: dmessage
				}),
				beginButton: new Button({
					text: 'Aceptar',
					press: function() {

						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});
			dialog.open();
		}
	};

	return Utilities;
}, /* bExport= */ true);