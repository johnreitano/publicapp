angular.module('Publicapp.claimPage', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider, $stateParams, $scope){

    $stateProvider

    .state('app.claimPage', {
      url: "/claim-page/:id",
      views: {
        'menuContent': {
          templateUrl: 'modules/claim_page/claim_page.html',
          controller: "ClaimPageCtrl as vm"
        }
      }
    })

    .state('app.claimPage.notSignedIn', {
      url: "/not-signed-in"
    })

    .state('app.claimPage.signedIn', {
      url: "/signed-in",
      authenticate: true,
      params: {
        viaSignUp: false
      }
    })

}])

.controller('ClaimPageCtrl', function($scope, SharedMethods, $stateParams, Fireb, $firebaseObject, $state, $ionicLoading, $rootScope) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  // retrueve user data for specfied id
  var userRef = Fireb.ref().child('users').child($stateParams.id);
  ctrl.user = $firebaseObject(userRef);
  ctrl.ready = false;

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    if (toState.name == "app.claimPage") {
      event.preventDefault();
      if (Fireb.signedIn()) {
        $state.go("app.claimPage.signedIn", toParams);
      } else {
        $state.go("app.claimPage.notSignedIn", toParams);
      }
    }
  });

  ctrl.request = {
    reason: '',
    certainty: 'not sure',
    email: ctrl.signedInUser() ? ctrl.signedInUser().email : '',
    phone: ctrl.signedInUser() ? ctrl.signedInUser().phone : ''
  };

  ctrl.submitRequest = function() {
    ctrl.request = _.pick(ctrl.request, ['reason', 'certainty', 'email', 'phone']);
    ctrl.request.status = 'Received';
    ctrl.request.claimedUser = _.pick(ctrl.user, ['id', 'name', 'username', 'email', 'phone']);
    Fireb.signedInUserRef().child("pageIdentityRequests").push(ctrl.request);
    $ionicLoading.show({ template: 'Item Added!', noBackdrop: true, duration: 2000 });
    $ionicLoading.show({ template: 'Your request has been received. We will get back to you soon.', noBackdrop: true, duration: 6000 });
    ctrl.goHome();
  };

  ionic.Platform.ready(function() {
    ctrl.ready = true
  });

})

;
