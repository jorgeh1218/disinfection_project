sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/model/Filter',
	'./Utilities',
	"sap/m/Dialog",
	"./Formatter"
], function(Controller, Filter, Utilities, Dialog, Formatter) {
	"use strict";

	return Controller.extend("DisinfectionApp.controller.Main", {
		//Text Formatter for dates
		Formatter: Formatter,
		goSheds: function() {
			var router = sap.ui.core.UIComponent.getRouterFor(this);
			router.navTo("sheds", {}, true /*no history*/ );
		},
		onInit: function() {
			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this.getOwnerComponent().getRouter(this).getRoute("main").attachMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function() {
			var model = this.getView().getModel("data");
			if (model.getProperty("/sheds") == null || model.getProperty("/sheds") == "") {
				this.goSheds();
			}
			if (model.getProperty("/actions") == "" || model.getProperty("/processes")) {
				this.initialMainViewPulls();
			}
		},
		onDetail: function() {
			var dialog = sap.ui.xmlfragment("DisinfectionApp.view.Dialog", this);
			this.getView().addDependent(dialog);
			dialog.open();
		},
		onSuggest: function(event) {
			var typeField = event.getSource();
			var sTerm = event.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("name", sap.ui.model.FilterOperator.StartsWith, sTerm));
			}
			typeField.getBinding("suggestionItems").filter(aFilters);
			typeField.suggest();
		},
		onSuggestProcess: function(event) {
			console.log(this.getView().getModel("data").getProperty("/processes"));
			var typeField = event.getSource();
			var sTerm = event.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("NAME", sap.ui.model.FilterOperator.StartsWith, sTerm));
			}
			typeField.getBinding("suggestionItems").filter(aFilters);
			typeField.suggest();
		},
		onSelectIconTab: function() {
			var view = this.getView();
			var settings, entitySelected, data;
			var key = view.byId("tabBar").getSelectedKey();
			//Getting selected key, separating string from viewIdString
			key = key.split("--")[1];
			//Set entity selected
			settings = view.getModel("settings");
			data = view.getModel("data");
			entitySelected = settings.getProperty("/entity-selected");
			settings.setProperty("/entity-selected", key);
			switch (key) {
				case "componentTab":
					//	if (data.getProperty("/component/processess") == "") {
					//Call service
					settings.setProperty("/visible-buttonComplete", true);
					settings.setProperty("/visible-buttonDelete", true);
					settings.setProperty("/visible-buttonUndo", false);
					if (data.getProperty("/processes") == "" || data.getProperty("/actions") == "") {
						this.pullProcesses();
						this.pullActions();
						this.pullEquipments();
					}
					//	}
					break;
				case "historyTab":
					settings.setProperty("/visible-buttonComplete", false);
					settings.setProperty("/visible-buttonDelete", false);
					settings.setProperty("/visible-buttonUndo", true);
					if (data.getProperty("/history") == "") {
						//Call service
					}
					break;
			}
		},
		////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Section Filters
		//
		////////////////////////////////////////////////////////////////////////////////////////////
		log_onNameSearch: function(oEvt) {
			// add filter for search
			var aFilters = [];
			var sQuery = oEvt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter("name", sap.ui.model.FilterOperator.Contains, sQuery);
				//var filter2 = new Filter("Tplnr", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
				//	aFilters.push(filter2);
			}

			// update list binding
			var list = this.getView().byId("logTable");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},
		log_onProcessSearch: function(oEvt) {
			// add filter for search
			var aFilters = [];
			var sQuery = oEvt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter("process", sap.ui.model.FilterOperator.Contains, sQuery);
				//var filter2 = new Filter("Tplnr", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
				//	aFilters.push(filter2);
			}

			// update list binding
			var list = this.getView().byId("logTable");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},
		log_onActionSearch: function(oEvt) {
			// add filter for search
			var aFilters = [];
			var sQuery = oEvt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter("action", sap.ui.model.FilterOperator.Contains, sQuery);
				//var filter2 = new Filter("Tplnr", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
				//	aFilters.push(filter2);
			}
			// update list binding
			var list = this.getView().byId("logTable");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},
		////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Section Utilities
		//
		////////////////////////////////////////////////////////////////////////////////////////////
		//Remove selections from both tables
		unselectTables: function() {
			var view = this.getView();
			var componentTable = view.byId("componentTable").removeSelections(true);
			var logTable = view.byId("logTable").removeSelections(true);
		},
		bindActions: function(action) {
			var view = this.getView();
			var i;
			var model = view.getModel("data");
			var arrayHistory = model.getProperty("/UX_listHistory");
			var arrayEquipments = model.getProperty("/UX_listActualComponents");
			var itemsSelected = model.getProperty("/INTERNAL_selectedComponents");
			var length = itemsSelected.length;
			var path;
			var element;
			for (i = length - 1; i != -1; i--) {
				path = model.getProperty("/INTERNAL_selectedComponents/" + i + "/path");
				element = model.getProperty(path); //Get Element saved
				element.action = action; // Bind property action to every
				element.undo = true;
				//selected element to be completed
				arrayHistory.push(element); //Push to history
				console.log(path);
				path = path.split("/")[2];
				console.log(path);
				arrayEquipments.splice(parseInt(path), 1); //Deleting the selected element from model
			}
			model.setProperty("/UX_listHistory", arrayHistory);
		},
		showDialog: null,
		onComplete: function() {
			var i, length;
			var view = this.getView();
			var table = view.byId("componentTable");
			length = table.getSelectedItems().length;
			var model = view.getModel("data");
			var elements = table.getSelectedItems();
			var pushElement, arrayPush = [];
			//Initialize Model
			model.setProperty("/INTERNAL_selectedComponents", "");
			if (length != 0) {
				//Binding to the model, the elements selected in the table
				for (i = 0; i != length; i++) {
					pushElement = {
						path: elements[i].getBindingContext("data").sPath
					};
					arrayPush.push(pushElement);
				}
				model.setProperty("/INTERNAL_selectedComponents", arrayPush);
				if (!this.showDialog) {
					this.showDialog = sap.ui.xmlfragment("DisinfectionApp.view.Action", this);

					// Remember selections if required
					this.showDialog.setRememberSelections(true);

					this.getView().addDependent(this.showDialog);
					this.showDialog.open();
				}
			} else {
				Utilities.messageDialogCreator("Aviso", "Debe seleccionar un elemento de la tabla para poder completar");
			}
		},
		onUndo: function() {
			var view = this.getView();
			var elements = view.byId("logTable").getSelectedItems();
			var length = elements.length,
				i;
			var model = view.getModel("data");
			var undoElement, undoArray = [],
				activeElements = [],
				historyArray = model.getProperty("/UX_listHistory");
			var path;
			if (length != 0) //Elements selected?
			{
				for (i = length - 1; i != -1; i--) {
					path = elements[i].getBindingContext("data").sPath;
					undoElement = model.getProperty(path); //Get Selected Element from Model
					if (undoElement.undo) // If the element has the undo property marked as true
					{
						path = path.split("/")[2];
						console.log(path);
						historyArray.splice(parseInt(path), 1); //Deleting the selected element from model in history
						undoArray.push(undoElement);
					}
				}
				if (undoArray.length != 0) //If there are elements to undo inside the array
				{
					console.log(undoArray);
					activeElements = model.getProperty("/UX_listActualComponents"); // Elements in equipments and structures list
					console.log(activeElements);
					activeElements = activeElements.concat(undoArray); //Merge elements from undo with active elements
					console.log(activeElements);
					model.setProperty("/UX_listActualComponents", activeElements); //Model updated with new elements from history
					model.setProperty("/UX_listHistory", historyArray); //Delete Elements from history since they have been moved to active elements
					this.unselectTables();
				}
			} else {
				Utilities.messageDialogCreator("Aviso", "Debe seleccionar un elemento de la tabla para poder deshacer");
			}
		},
		addListComponentElement: function() {
			var view = this.getView();
			var model = view.getModel("data");
			var element;
			var array = model.getProperty("/UX_listActualComponents");

			//Getting values from fields
			var startDateValue = view.byId("componentStart").getDateValue();
			var endDateValue = view.byId("componentEnd").getDateValue();

			console.log(startDateValue);
			var name = view.byId("componentName").getValue();
			var process = view.byId("componentProcess").getValue();
			var start = view.byId("componentStart").getValue();
			var end = view.byId("componentEnd").getValue();

			//Validating emptiness and end date greater or equal to start date
			if (name != "" && process != "" && start != "" && end != "") {
				if (endDateValue >= startDateValue) {
					this.putEmptyInputs();
					element = {
						process: process,
						name: name,
						start: start,
						end: end
					};
					array.push(element);
					model.setProperty("/UX_listActualComponents", array);
				} else {
					Utilities.messageDialogCreator("Aviso", "Por favor, verifique que las fechas ingresadas sean correctas");
				}
			} else {
				Utilities.messageDialogCreator("Aviso", "Por favor, complete los campos vacíos del elemento a insertar");
			}
		},
		handleClose: function(oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				this.unselectTables();
				this.bindActions(aContexts.map(function(oContext) {
					return oContext.getObject().NAME;
				}).join(", "));
			}
			//	oEvent.getSource().getBinding("data").filter([]);
			this.showDialog = null;
		},
		putEmptyInputs: function() {
			var view = this.getView();
			//Getting values from fields
			var name = view.byId("componentName").setValue("");
			var process = view.byId("componentProcess").setValue("");
			var start = view.byId("componentStart").setValue("");
			var end = view.byId("componentEnd").setValue("");
		},
		////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Section Calls
		//
		////////////////////////////////////////////////////////////////////////////////////////////
		initialMainViewPulls: function() {
			this.pullEquipments();
			this.pullProcesses();
			this.pullActions();
		},
		pullActions: function() {
			var model = this.getView().getModel("data");
			var URL = "/SimpleFarm/services/XSJS/operationDesinfection.xsjs?METHOD=getActions";
			var call = {
				url: URL,
				method: 'GET',
				dataType: 'json',
				success: function(res) {
					console.log(res);
					if (res.meta.statuscode !== 200) {

					} else {
						model.setProperty("/actions", res.results);
					}
				},
				error: function(res) {

				}
			};
			$.ajax(call);
		},
		pullProcesses: function() {
			var view = this.getView();
			var model = view.getModel("data");
			var settings = view.getModel("settings");
			var URL = "/SimpleFarm/services/XSJS/operationDesinfection.xsjs?METHOD=getProcesses";
			var call = {
				url: URL,
				method: 'GET',
				dataType: 'json',
				success: function(res) {
					console.log(res);
					if (res.meta.statuscode !== 200) {

					} else {
						settings.setProperty("busy-processes", false);
						model.setProperty("/processes", res.results);

					}
				},
				error: function(res) {

				}
			};
			settings.setProperty("busy-processes", true);
			$.ajax(call);
		},
		pullEquipments: function() {
			var view = this.getView();
			var model = view.getModel("data");
			var settings = view.getModel("settings");
			var URL = "/SimpleFarm/services/XSJS/operationDesinfection.xsjs?METHOD=getEquipments";
			var call = {
				url: URL,
				method: 'GET',
				dataType: 'json',
				success: function(res) {
					console.log(res);
					if (res.meta.statuscode !== 200) {

					} else {
						console.log("Binded");
						settings.setProperty("busy-equipments", false);
						model.setProperty("/equipments", res.results);
					}
				},
				error: function(res) {

				}
			};
			settings.setProperty("busy-equipments", true);
			$.ajax(call);
		}

	});
});