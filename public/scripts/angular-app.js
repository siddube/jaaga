var app = angular.module('jaagaApp', ['ui.router', 'ngMap','gm']);

app.config(['$stateProvider','$urlRouterProvider',function($stateProvider, $urlRouterProvider) {
  $stateProvider.state('login', {
      url: '/login',
      templateUrl: 'assets/partials/login.html',
      controller: 'AuthCtrl'
  });
  $stateProvider.state('register', {
      url: '/register',
      templateUrl: 'assets/partials/register.html',
      controller: 'AuthCtrl'
  });
  $stateProvider.state('app', {
    url: '/app',
    templateUrl: 'assets/partials/app.html',
    controller: 'MainCtrl'
  });
  $stateProvider.state('places', {
    url: '/places',
    templateUrl: 'assets/partials/places.html',
    controller: 'PlaceCtrl'
  });
  $urlRouterProvider.otherwise('login');
}]);

app.controller('MainCtrl', ['$scope', '$http', 'auth', function ($scope, $http, auth) {
  'use strict';
  $.material.init();
  $scope.currentUser = auth.currentUser;
  $scope.lat = undefined;
  $scope.lng = undefined;
  
  $scope.$on('gmPlacesAutocomplete::placeChanged', function(){
    var location = $scope.autocomplete.getPlace();
    $scope.address = location.formatted_address;
    $scope.name = location.name;
    $scope.lat = location.geometry.location.lat();
    $scope.lng = location.geometry.location.lng();
    $scope.$apply();
  });
  
  $scope.submitPlace = function () {
    var reqObj = {
      userid: auth.currentId(),
      name: $scope.name,
      location: $scope.address,
      lat: $scope.lat,
      lng: $scope.lng
    };
    
    $http({
			method: 'POST',
			url: 'http://localhost:8080/savelocation',
			data: {
				requestObj: reqObj
			},
			headers: {
			"Content-Type": "application/json;charset=utf-8"
			}
		}).then(function successCallback(response) {
			console.log(response.data);
		});
    
  };
}]);

app.controller('PlaceCtrl', ['$scope','$http', 'auth', function ($scope, $http, auth) {
  'use strict';
  $.material.init();
  $scope.currentUser = auth.currentUser();
  $scope.userId = auth.currentId();
  var data = { userid: $scope.userId};
  var config = {params: data};
  $http.get('http://localhost:8080/fetchplaces/:' + $scope.userId).then(function successCallback(response) {
    $scope.places = response.data;
    
  });
    
}]);

app.controller('NavCtrl', ['$scope', '$state', 'auth',function($scope, $state, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = function() {
    auth.logOut;
    $state.go('login');
  }
  $scope.showPlaces = function () {
    $state.go('places');
  }
  $scope.showHome = function () {
    $state.go('app');
  }
}]);

app.controller('AuthCtrl', ['$scope','$http', '$state','auth', function($scope, $http, $state, auth){
  $.material.init();
  $scope.user = {};
  
  $scope.register = function(){
    
    auth.register($scope.user).then(function successCallback(response){
      $state.go('app');
    },function errorCallback(response) {
      console.log(response);
      if(response.status === 400) {
        $scope.error = 'Please Enter Valid Username and Password';
      }
      if(response.status === 500) {
        $scope.error = 'This Username already exists';
      }
    });
  };
  
  $scope.logIn = function(){
    auth.logIn($scope.user).then(function successCallback(response){
      $state.go('app');
    },function errorCallback(response) {
      //$scope.error = response;
      if(response.status === 401) {
        $scope.error = 'Invalid UserName or Password';
      }
    });
  };
  
  $scope.logOut = function () {
    auth.logOut().then(function successCallback(response){
      $state.go('login');
    }, function errorCallback(response){
      $scope.error = response;
    });
  };
}]);

app.factory('auth', ['$http', '$window', function ($http, $window) {
  'use strict';
  var auth = {};
  
  auth.saveToken = function (token){
    $window.localStorage['jaaga-token'] = token;
  };

  auth.getToken = function (){
    return $window.localStorage['jaaga-token'];
  }
  
  auth.isLoggedIn = function(){
    var token = auth.getToken();

    if(token){
      
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };
  
  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };
  
  auth.currentId = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload._id;
    }
  };
  
  auth.register = function(user){
    return $http.post('/register', user).then(function(resp){
      auth.saveToken(resp.data.token);
    });
  };
  
  auth.logIn = function(user){
    return $http.post('/login', user).then(function(resp){
      auth.saveToken(resp.data.token);
    });
  };
  
  auth.logOut = function(){
    $window.localStorage.removeItem('jaaga-token');
  };

  return auth;
}]);