var app = angular.module('zombieDrive', ['ngRoute']);

app.config(['$routeProvider', function($routeProvider){
	$routeProvider
		.when('/doc', {
			templateUrl: 'templates/doc.html'
		});
}]);

app.service('googleDriveService', function(){
	this.drive = (function(){

		var action;
		var authResponse;

		var pub = {};
		pub.init = function() {
			var interval = window.setInterval(function(){
				//console.log(this);
	        	if (pub.checkAuth){
	          		pub.checkAuth();
	          		window.clearInterval(interval);
	        	}
	      	}, 2000);
	    };

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
	      		authResponse = true;
	    	} else {
	      		authResponse = false;
	    	}
	 	 };

	 	pub.loadDriveApi = function() {
	    	gapi.client.load('drive', 'v2', action);
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

	googleDriveService.drive.init();
	
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
	}
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
