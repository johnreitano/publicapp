angular.module('Publicapp.profile', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider, $stateParams){

    $stateProvider

    .state('app.profile', {
      url: "/profile/:id",
      views: {
        'menuContent': {
          templateUrl: 'modules/profile/profile.html',
          controller: "ProfileCtrl as vm"
        }
      },
      authenticate: true
    });
}])

.controller('ProfileCtrl', function($scope, $location, SharedMethods, $stateParams, Fireb, $firebaseObject) {
  var ctrl = this;

  ctrl.profile = null;


  angular.extend(ctrl, SharedMethods);

  ctrl.userId = $stateParams.id;

  // retrueve user data for specfied id
  $scope.ctrl = ctrl; // TODO: remove this?

  var userRef = Fireb.ref.child('users').child(ctrl.userId);
  ctrl.user = $firebaseObject(userRef);

  ctrl.viewingOwnPage = function() {
    return !ctrl.userId || !ctrl.signedInUserId() || ctrl.userId == ctrl.signedInUserId();
  };

  ctrl.showPost = function(post) {
    // var postUrl = "/profile/" + post.authorUserId + "/messages/post/" + post._id;
    var postUrl = "/profile/" + post.authorUserId + "/feed/post/" + post._id;
    $location.path(postUrl);
  }

})

;
