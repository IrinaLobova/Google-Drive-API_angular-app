var app = angular.module('zombiedrive', ['ngRoute', 'ngSanitize']);

app.service('googleDriveService', ['$http', function($http){
	this.drive = (function(){

		var files, doctext, client_id;

		var checkAuth = function() {
			gapi.auth.authorize({
        		'client_id': window.config.CLIENT_ID,
        		'scope': window.config.SCOPES,
        		'immediate': true
      		}, handleAuthResult);
		};

	    var handleAuthResult = function(authResult) {
	    	if (authResult && !authResult.error) {
	    		client_id = authResult.client_id;
	      		loadDriveApi();
	    	} else {
	      		console.log("error");
	    	}
	 	 };

	 	var loadDriveApi = function() {
	 		gapi.client.load('drive', 'v2', loadFiles);
		};

	  	var loadFiles = function() {
	  		var request = gapi.client.drive.files.list({
        		'maxResults': 10,
        		'q': "mimeType = 'application/vnd.google-apps.document'"
      		});
      		request.execute(function(resp) {
        		files = resp.items;
	  		});
	  	};

	  	var pub = {};

	  	pub.handleAuthClick = function() {
	    	gapi.auth.authorize(
	      	{
	        	client_id: window.config.CLIENT_ID, 
	        	scope: window.config.SCOPES, 
	        	immediate: false
	      	}, handleAuthResult);
	    	return false;
	  	};

	  	pub.getFiles = function(){
	  		return files;
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
	  		$http.get(url, {
				headers: { 'Authorization' : "Bearer " + gapi.auth.getToken().access_token }
	  		}).then(function successCallback(response) {
    				doctext = response.data;
  				}, function errorCallback(response) {
    				console.log('smth went wrong');
  			});
	  	};

	  	pub.getDocText = function(){
	  		return doctext;
	  	};

	  	pub.getClientId = function() {
	  		return client_id;
	  	};

	  	return pub;
	})();
}]);

app.service('zombifyService', ['$http', function($http){
	var svc = this;
	var doctext = 'ex';
	svc.translate = (function(){
		var pub = {};
		pub.tozombie = function(text){
			var url = 'http://ancient-anchorage-9224.herokuapp.com/zombify?q=' + text;
		    $http.get(url).then(function successCallback(response) {
    				doctext = response.data.message;
  				}, function errorCallback(response) {
    				console.log('smth went wrong');
  			});
		};
		pub.getText = function(){
			return doctext;
		};

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

	var interval = window.setInterval(function() {
		var result = googleDriveService.drive.getFiles();
		if (result) {
			window.clearInterval(interval);
			vm.files = result;
			scope.$digest();
		}
	}, 1000);
	
}]);

app.controller('docController', ['googleDriveService', 'zombifyService', '$location', '$rootScope',
	                     function(googleDriveService, zombifyService, $location, $rootScope){
	var vm = this;
	var id = $location.path().substring(5);

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
		var result = encodeURIComponent(googleDriveService.drive.getDocText());
		if (result) {
			window.clearInterval(interval);
			zombifyService.translate.tozombie(result);

			var interval2 = window.setInterval(function(){
				var result2 = zombifyService.translate.getText(); 
				if (result2 !== undefined) {

					window.clearInterval(interval2);
					var doctext = zombifyService.translate.getText(); 
					vm.doctext = doctext.replace(/\n/g, "<br>");
					scope.$digest();
				}
			}, 1000);
		}
	}, 1000);
}]);

app.controller('authbtnController', ['googleDriveService', function(googleDriveService){
	var vm = this;
	vm.authorize = googleDriveService.drive.handleAuthClick;
}]);

app.directive('authbtn', function(){
	return {
		templateUrl: '../templates/authBtn.html',
	};
});

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
