var app = angular.module('zombieDrive', ['ngRoute']);

app.service('googleDriveService', function(){
	this.drive = (function(){

		var action;
		var authResponse;
		var files = undefined;
		var authCb;

		var pub = {};

		pub.checkAuth = function() {
			gapi.auth.authorize(
	      		{
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

	  	return pub;
	})();
});

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

	var listFiles = function(){

	};

}]);

app.controller('docController', ['googleDriveService', function(googleDriveService){

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
		.when('/doc', {
			templateUrl: 'templates/doc.html',
			controller: 'docController',
			controllerAs: 'vm'
		})
		.otherwise({
			redirectTo: '/'
		});
}]);
