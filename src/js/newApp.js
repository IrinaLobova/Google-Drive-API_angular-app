var app = angular.module('zombieDrive', ['ngRoute', 'ngSanitize']);

/*
	TODO:
	1. doc controller should know file.id to retrieve file object with plain/text url from service
	2. create a service method with angular http request to get file via text/plain link
	3. save the result of http request so that controller can replace \n with <br> + zombify
	4. output the resulted text with replaced \n and zombify
*/

app.service('googleDriveService', ['$http', function($http){
	this.drive = (function(){

		var action;
		var files;
		var doctext = undefined;

		var pub = {};

		pub.checkAuth = function() {
			gapi.auth.authorize({
        		'client_id': window.config.CLIENT_ID,
        		'scope': window.config.SCOPES,
        		'immediate': true
      		}, pub.handleAuthResult);
		};

	    pub.handleAuthResult = function(authResult) {
	    	if (authResult && !authResult.error) {
	      		pub.loadDriveApi();
	    	} else {
	      		console.log("error");
	    	}
	 	 };

	 	pub.loadDriveApi = function() {
	 		gapi.client.load('drive', 'v2', action);
		};

	  	pub.loadFiles = function() {
	  		var request = gapi.client.drive.files.list({
        		'maxResults': 10,
        		'q': "mimeType = 'application/vnd.google-apps.document'"
      		});
      		request.execute(function(resp) {
        		files = resp.items;
        		console.log("service" + files);
	  		});
	  	};

	  	pub.handleAuthClick = function(event) {
	    	gapi.auth.authorize(
	      	{
	        	client_id: window.config.CLIENT_ID, 
	        	scope: window.config.SCOPES, 
	        	immediate: false
	      	}, pub.handleAuthResult);
	    	return false;
	  	};

	  	pub.getFiles = function(){
	  		return files;
	  	};

	  	pub.setAction = function(actionString) {
	  		if (actionString === 'list')
	  			action = pub.loadFiles;
	  		else if (actionString === 'doc')
	  			action = action;
	  	};

	  	pub.getTextUrl = function(id) {
	  		for (var i =0; i < files.length; i++) {
	  			if (id === files[i].id){
	  				return files[i].exportLinks['text/plain'];
	  			}
	  		}
	  	};

	  	pub.getFileText = function(id) {
	  		var url = pub.getTextUrl(id);
	  		console.log("request for file contents " + url);
	  		$http.get(url, {
				headers: { 'Authorization' : "Bearer " + gapi.auth.getToken().access_token }
	  		}).then(function successCallback(response) {
    				// this callback will be called asynchronously
    				// when the response is available
    				console.log(response.data);
    				doctext = response.data;
  				}, function errorCallback(response) {
    				// called asynchronously if an error occurs
    				// or server returns response with an error status.
    				console.log('smth went wrong');
  			});
	  	};

	  	pub.getDocText = function(){
	  		return doctext;
	  	}

	  	return pub;
	})();
}]);

app.service('zombifyService', ['$http', function($http){
	var doctext;
	this.translate = (function(){
		var pub = {};
		pub.tozombie = function(text){
			var url = 'http://ancient-anchorage-9224.herokuapp.com/zombify?q=' + text;

		    $http.get(url, {
	  		}).then(function successCallback(response) {
    				// this callback will be called asynchronously
    				// when the response is available
    				doctext = response.data.message;
    				console.log(response.data.message);
  				}, function errorCallback(response) {
    				// called asynchronously if an error occurs
    				// or server returns response with an error status.
    				console.log('smth went wrong');
  			});
		};
		pub.getText = function(){
			return doctext;
		}

		return pub;
	})();
}]);

app.controller('listController', ['googleDriveService', '$rootScope', 
						  function(googleDriveService, $rootScope) {
	var vm = this;
	var scope = $rootScope;
	vm.files;

	scope.$watch(
  		function() { return vm.files; },
  		function(newValue, oldValue) {
    		if ( newValue !== oldValue ) {
      			vm.files = newValue;
    		}
  		}
	);

	googleDriveService.drive.setAction('list');
	var interval = window.setInterval(function() {
		var result = googleDriveService.drive.getFiles();
		if (result) {
			window.clearInterval(interval);
			vm.files = result;
			scope.$digest();
			showFiles(vm.files);
		}
	}, 1000);
	
	var showFiles = function() {
		console.log(vm.files);
	};

}]);

app.controller('docController', ['googleDriveService', 'zombifyService', '$location', '$rootScope',
	                     function(googleDriveService, zombifyService, $location, $rootScope){
	var vm = this;
	var id = $location.path().substring(5);
	console.log("controller doc" + id);

    var scope = $rootScope;
	vm.doctext;

	scope.$watch(
  		function() { return vm.doctext; },
  		function(newValue, oldValue) {
    		if ( newValue !== oldValue ) {
      			vm.doctext = newValue;
    		}
  		}
	);

	googleDriveService.drive.getFileText(id);

	var interval = window.setInterval(function() {
		var result = googleDriveService.drive.getDocText();
		if (result) {
			window.clearInterval(interval);
			var doctext = result.replace(/\n/g, "<br>");
			zombifyService.translate.tozombie(doctext);

			var interval2 = window.setInterval(function(){
				var result2 = zombifyService.translate.getText(); 
				if (result2 !== undefined) {
					window.clearInterval(interval2);
					vm.doctext = zombifyService.translate.getText();
					scope.$digest();
				};
			}, 1000);
		}
	}, 1000);
}]);

app.controller('authbtnController', ['googleDriveService', function(googleDriveService){
	var vm = this;
	vm.authorize = googleDriveService.drive.handleAuthClick;
}]);

app.directive('authbtn', ['googleDriveService', function(googleDriveService){
	return {
		templateUrl: '../templates/authBtn.html',
	};
}]);

app.config(['$routeProvider', function($routeProvider){
	$routeProvider
		.when('/list', {
			templateUrl: 'templates/list.html',
			controller: 'listController',
			controllerAs: 'vm'
		})
		.when('/doc/:fileId', {
			templateUrl: 'templates/doc.html',
			controller: 'docController',
			controllerAs: 'vm'
		})
		.otherwise({
			redirectTo: '/'
		});
}]);
