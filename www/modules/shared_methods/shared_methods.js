angular.module('Publicapp.sharedMethods', [])

.service('SharedMethods', function($timeout, $state, Fireb){

  var signedInUserId = function() {
    return Fireb.signedInUserId;
  };

  var signedInUser = function() {
    return Fireb.signedInUser;
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

  function author(post) {
    return Meteor.users.findOne(post.authorUserId);
  };

  function subject(post) {
    return Meteor.users.findOne(post.subjectUserId);
  };

  function createdAtRelative(post) {
    return moment(post.createdAt).fromNow();
  };

  function tagLineOrMostRecentPost( user ) {
    if (s.isBlank(user.tagLine)) {
      postRef = Fireb.ref.child("posts").child("feedMessageStubs").orderByChild("addedAt").limitToLast(1);
      postRef.once("child_added").then(function(snapshot) { // handle error case
        console.log(snapshot.key());
        var mostRecentPost = snapshot.val();
        return 'Latest post: ' + mostRecentPost.text;
      });
    } else {
      return user.tagLine;
    }
  };

  function listeningTo(listeneeStub) {
    return signedInUser() && signedInUser().listeneeStubs.indexOf(listeneeStub.$id) != -1;
  };

  function showProfile(user, event) {
    if (user && user._id) {
      $state.go( "app.profile", { id: user._id } );
    }
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }
  };

  function toggleListening(listenee, event) {
    var listeneeUserIds = signedInUser().listeneeUserIds;
    if (listeningTo(listenee)) {
      listeneeUserIds = _.without(listeneeUserIds, listenee._id);
    } else {
      listeneeUserIds.unshift(listenee._id);
    }
    Meteor.users.update( Meteor.userId(), {$set: { "profile.listeneeUserIds": listeneeUserIds }} );
    signedInUser().listeneeUserIds = listeneeUserIds;
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

  return {
    signedInUserId: signedInUserId,
    signedInUser: signedInUser,
    signedIn: signedIn,
    createPost: createPost,
    author: author,
    subject: subject,
    createdAtRelative: createdAtRelative,
    tagLineOrMostRecentPost: tagLineOrMostRecentPost,
    listeningTo: listeningTo,
    showProfile: showProfile,
    toggleListening: toggleListening,
    generateUsernameOnTheFly: generateUsernameOnTheFly
  };
})

;
