describe('zombify service', function(){
  var zombifyService, $httpBackend, windowMock, gDriveService;
  var text = 'what a wonderful day';
  var doctextMock = { 'message': 'whhrat hra wrrrRrndrrRRfrrrrRrl dhray' };
  var clientIdMock = { 'client_id': '80355934782-n3vs4o6565a12ol96b1qe2o5b54174av.apps.googleusercontent.com'};

  beforeEach(function () {
      module('zombiedrive');
      inject(function($injector) {
         windowMock = $injector.get('$window');
      });
  });

  beforeEach(function(){
    inject(function($injector){
      zombifyService = $injector.get('zombifyService');
      gDriveService = $injector.get('googleDriveService');
      $httpBackend = $injector.get('$httpBackend');
    });
    $httpBackend
      .when('GET', 'http://ancient-anchorage-9224.herokuapp.com/zombify?q=' + text)
      .respond(200, doctextMock);
  });

  beforeEach(function(){
    windowMock.gapi = {
      auth: {
        authorize: function(options, callback) {
          var authResult = {
            'client_id': '80355934782-n3vs4o6565a12ol96b1qe2o5b54174av.apps.googleusercontent.com',
            'error': false
          };
          callback(authResult);
        }
      },
      client: {
        load: function(a,b,c){
          return;
        }
      }
    };
  });

  describe('zombify service', function(){
    it("should get the correct zombified text", function(){
      zombifyService.translate.tozombie(text);
      $httpBackend.flush();
      var result = zombifyService.translate.getText();
      expect(result).toBe(doctextMock.message);
    });
  });

  describe('g service', function(){
    it("should get the correct client_id", function(){
      gDriveService.drive.handleAuthClick();
      console.log("test log " + gDriveService.drive.getClientId());
      expect(gDriveService.drive.getClientId()).toBe(clientIdMock.client_id);

    });
  });
});