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

.controller('ProfileCtrl', function($scope, $location, SharedMethods, $reactive, $stateParams) {
  var ctrl = this;

  $scope.ctrl = ctrl;

  angular.extend(ctrl, SharedMethods);

  $reactive(this).attach($scope);

  ctrl.userId = function() {
    return $stateParams.id || ctrl.loggedInUserId();
  };

  ctrl.user = function() {
    return $stateParams.id ? Meteor.users.findOne($stateParams.id) : ctrl.loggedInUser();
  };

  ctrl.helpers({
    posts: () => {

      var cursor = Posts.find(
        { $or: [ { authorUserId: ctrl.userId() }, { subjectUserId: ctrl.userId() } ] },
        { sort: {createdAt : -1} }
      );

      if (ctrl.userId() == ctrl.loggedInUserId()) {
        // play a notification sound every time a message related to the logged-in user is received
        var initializing = true;
        var sound = new buzz.sound('/sounds/dewdrop_touchdown.ogg');
        cursor.observeChanges({
          added: function(id, post) {
            if(!initializing) {
              sound.play();
            }
          }
        });
        initializing = false;
      }

      return cursor;

    },
    listeners: () => {
      return Meteor.users.find(
        { "profile.listeneeUserIds": { $in: [ ctrl.userId() ] } },
        { sort: {createdAt : -1} }
      );
    }

  });

  ctrl.viewingOwnPage = function() {
    return !ctrl.userId() || !ctrl.loggedInUserId() || ctrl.userId() == ctrl.loggedInUserId();
  };

  ctrl.showPost = function(post) {
    // var postUrl = "/profile/" + post.authorUserId + "/messages/post/" + post._id;
    var postUrl = "/profile/" + post.authorUserId + "/feed/post/" + post._id;
    $location.path(postUrl);
  }

})

;
