angular.module('Publicapp.post', [])

  .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.postViaFeed', {
      url: "/profile/:profileId/feed/post/:id",
      views: {
        'menuContent': {
          templateUrl: "client/modules/post/post.html",
          controller: "PostCtrl as vm"
        }
      },
      authenticate: true
    })

    .state('app.postViaProfile', {
      url: "/profile/:profileId/messages/post/:id",
      views: {
        'menuContent': {
          templateUrl: "client/modules/post/post.html",
          controller: "PostCtrl as vm"
        }
      },
      authenticate: true
    })

  }])

  .controller('PostCtrl', function($scope, $meteor, $stateParams, SharedMethods) {
    var ctrl = this;

    angular.extend(ctrl, SharedMethods);

    ctrl.post = Posts.findOne($stateParams.id);
  })

  .factory('NewPostModal', function(SharedMethods) {
    return {
      open: function($scope, user) {
        var modalInstance;
        var newScope = $scope.$new();
        $ionicModal.fromTemplateUrl('client/modules/post/new_post.html', {
          scope: newScope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          modalInstance = modal;
          modalInstance.show();
        });

        newScope.newPost = {};
        newScope.newPost.user = user;
        newScope.newPost.postHelperMethods = SharedMethods;

        newScope.newPost.submit = function() {
          modalInstance.hide();
        };

        newScope.newPost.cancel = function() {
          modalInstance.hide();
        };
      },
      close: function() {
        modalInstance.hide();
      }
    };
  })

;
