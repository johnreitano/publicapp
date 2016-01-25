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

.controller('ProfileCtrl', function($scope, $location, SharedMethods, $stateParams, Fireb) {
  var ctrl = this;

  ctrl.profile = null;


  angular.extend(ctrl, SharedMethods);

  ctrl.userId = $stateParams.id;

  // retrueve user data for specfied id
  $scope.ctrl = ctrl; // TODO: remove this?
  Fireb.ref.child("users").child(ctrl.userId).once("value", function(snapshot) {
    ctrl.user = snapshot.val();
  });

  var messages = {
    5: {
      authorUserId: 91,
      subjectUserId: 92,
    },
    6: {
      authorUserId: 105,
      subjectUserId: 91,
    }
  };

  users = {
    91: {
      username: "joeb",
      profileMessages: {
        5: {
          createdAt: "xxx"
        },
        6: {
          createdAt: "xxx"
        }
      },
      feedMessages: {
        5: {
          createdAt: "xxx"
        },
        6: {
          createdAt: "xxx"
        },
        7: {

        }
      },
      listenees: {
        7: {
          addedAt: "xxx"
        },
        8: {
          addedAt: "xxx"
        }
      },
      listeners: {
        9: {
          addedAt: "xxx"
        },
        10: {
          addedAt: "xxx"
        }
      }
    }
  };

  // ctrl.helpers({
  //   posts: () => {
  //
  //     var cursor = Posts.find(
  //       { $or: [ { authorUserId: ctrl.userId() }, { subjectUserId: ctrl.userId() } ] },
  //       { sort: {createdAt : -1} }
  //     );
  //
  //     if (ctrl.userId() == ctrl.signedInUserId()) {
  //       // play a notification sound every time a message related to the logged-in user is received
  //       var initializing = true;
  //       var sound = new buzz.sound('/sounds/dewdrop_touchdown.ogg');
  //       cursor.observeChanges({
  //         added: function(id, post) {
  //           if(!initializing) {
  //             sound.play();
  //           }
  //         }
  //       });
  //       initializing = false;
  //     }
  //
  //     return cursor;
  //
  //   },
  //   listeners: () => {
  //     return Meteor.users.find(
  //       { "profile.listeneeUserIds": { $in: [ ctrl.userId() ] } },
  //       { sort: {createdAt : -1} }
  //     );
  //   }
  //
  // });

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
