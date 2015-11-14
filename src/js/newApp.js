var app = angular.module('zombieDrive', ['ngRoute']);

app.config(['$routeProvider', function($routeProvider){
	$routeProvider
		.when('/doc', {
			templateUrl: 'templates/doc.html',
			controller: docController
		});
}]);

app.service('googleDriveService', function(){
	this.drive = (function(){

		var action;
		var authResponse;
		var files;
		var authCb;

		var pub = {};
		pub.init = function(cb) {
			var interval = window.setInterval(function(){
				//console.log(this);
	        	if (pub.checkAuth){
	          		pub.checkAuth(cb);
	          		window.clearInterval(interval);
	        	}
	      	}, 2000);
	    };

		pub.checkAuth = function(cb) {
			authCb = cb;
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
	      		authCb();
	      		//authResponse = true;
	    	} else {
	      		console.log("error");
	      		//authResponse = false;
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
	  		});
	  	};

	  	pub.handleAuthClick = function(event) {
	    	gapi.auth.authorize(
	      	{
	        	client_id: clientIdService.CLIENT_ID, 
	        	scope: clientIdService.SCOPES, 
	        	immediate: false
	      	}, pub.handleAuthResult);
	    	return false;
	  	};

	  	pub.getResponse = function() {
	  		return authResponse;
	  	};

	  	pub.getFiles = function(){
	  		return files;
	  	};

	  	return pub;
	})();
});

app.controller('listController', ['googleDriveService', '$rootScope', function(googleDriveService, $rootScope){
	var vm = this;

	var scope = $rootScope;
	var result;
	vm.hide = false;
	
	scope.$watch(
  		function() { return vm.hide; },
  		function(newValue, oldValue) {
    		if ( newValue !== oldValue ) {
      			vm.hide = newValue;
    		}
  		}
	);
	
	var hideCb = function() { 
		vm.hide = true; 
		scope.$digest();
	};

	var listCb = function() {
		return;
	};

	googleDriveService.drive.init(hideCb);


	/*
	var interval = window.setInterval(function(){
		result = googleDriveService.drive.getResponse();
		if (result !== undefined) {
	    	hideCallback();
	    	window.clearInterval(interval);
	    }
	}, 2000);
	
	var hideCallback = function() {
		if (result === true) {
			// Hide auth UI, then load client library.
			//console.log("result = " + result);
			vm.hide = true;
			scope.$digest();
			//console.log(vm.name);
		}
	};
	*/
}]);

app.controller('docController', ['googleDriveService', function(googleDriveService){

}]);

// app.directive('authBtn', ['googleDriveService', function(googleDriveService){
// 	var link = function(scope, element, attrs){
// 		scope.authorize = googleDriveService.handleAuthClick;
// 	};
// 	return {
// 		scope: {},
// 		templateUrl: 'templates/oauth_button.html',
// 		link: link
// 	};
// }]);
