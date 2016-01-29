angular.module('Publicapp.sharedMethods', [])

.service('SharedMethods', function($timeout, $state, Fireb){

  var signedInUserId = function() {
    return Fireb.signedInUserId();
  };

  var signedInUser = function() {
    return Fireb.signedInUser();
  };

  var signedIn = function() {
    return Fireb.signedIn();
  };

	function createPost() {
    var ctrl = this;

    mentionedUsernames = ctrl.newPostText.match(/(@\w+)/);
    // TODO: notify all mentioned users
    // ...

    var insertPost = function(subjectUserId) {
      Posts.insert({
        authorUserId: signedInUserId(),
        subjectUserId: subjectUserId,
        text: ctrl.newPostText,
        createdAt: new Date()
      });
      ctrl.newPostText = '';
    };

    if (ctrl.userId == signedInUserId() && mentionedUsernames) {
      var firstMentionedUser = Meteor.users.findOne({ username: mentionedUsernames[0]});
      if (firstMentionedUser) {
        insertPost(firstMentionedUser._id);
      } else {
        Meteor.call("createPublicUser", { username: mentionedUsernames[0] }, function(error, newUserId) {
          insertPost(newUserId);
        });
      }
    } else {
      insertPost(ctrl.userId);
    }

    // scroll to top of posts so you can see new post
    var element = document.getElementById("scrollable-content");
    if (element) {
      angular.element(element).controller('scrollableContent').scrollTo(0);
    }

    // put focus back into new post textarea
    $timeout(function() {
      var element = document.getElementById("new-post-text");
      if (element) {
        element.focus();
      }
    })
	};

  function createdAtRelative(message) {
    return moment(message.createdAt).fromNow();
  };

  function showProfile(user, event) {
    if (user) {
      $state.go( "app.profile", { id: user.$id } );
    }
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }
  };

  function listeningTo(userStub) {
    if (signedInUser()) {
      var keys = _.keys(signedInUser().listeneeStubs);
      return keys.indexOf(userStub.$id) != -1
    } else {
      return false;
    }
  };

  function toggleListening(targetUser, event) {
    var signedInUserListeneeRef = Fireb.ref.child("users").child(signedInUserId()).child("listeneeStubs").child(targetUser.$id);
    var targetUserListenerRef = Fireb.ref.child("users").child(targetUser.$id).child("listenerStubs").child(signedInUserId());

    if (listeningTo(targetUser)) {
      signedInUserListeneeRef.remove(); // remove listenee from signedInUser
      targetUserListenerRef.remove(); // remove listener from targetUser
    } else {
      // add
      signedInUserListeneeRef.set({addedAt: Date.now()}); // add listenee to signedInUser
      targetUserListenerRef.set({addedAt: Date.now()}); // add listener to targetUSer
    }
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }
  };

  function generateUsernameOnTheFly(scope, formName) {
    var ctrl = this;

    ctrl[formName] = {};

    scope.$watch('vm.name', function() {
      if (ctrl[formName] && ctrl[formName].username && ctrl[formName].username.$pristine && ctrl.name && ctrl.name.length > 0) {
        ctrl.username = Fireb.generateUsername(ctrl.name);
      }
    }, true);
  };

  function isCurrentState(stateName) {
    return $state.current.name == stateName;
  };

  function peopleLink() {
    return window.isCordova ? 'app.people.contacts' : 'app.people.listenees';
  };

  return {
    signedInUserId: signedInUserId,
    signedInUser: signedInUser,
    signedIn: signedIn,
    createPost: createPost,
    createdAtRelative: createdAtRelative,
    listeningTo: listeningTo,
    showProfile: showProfile,
    toggleListening: toggleListening,
    generateUsernameOnTheFly: generateUsernameOnTheFly,
    isCurrentState: isCurrentState,
    peopleLink: peopleLink
  };
})

;
