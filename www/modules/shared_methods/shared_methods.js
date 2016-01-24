angular.module('Publicapp.sharedMethods', [])

.service('SharedMethods', function($timeout, $state){

  var loggedInUserId = function() {
    return Meteor.userId();
  };

  var loggedInUser = function() {
    return Meteor.user();
  };

  var noPostsAboutUser = function(user) {
    return !Posts.findOne({subjectUserId: user._id})
  };

	function createPost() {
    var ctrl = this;

    mentionedUsernames = ctrl.newPostText.match(/(@\w+)/);
    // TODO: notify all mentioned users
    // ...

    var insertPost = function(subjectUserId) {
      Posts.insert({
        authorUserId: loggedInUserId(),
        subjectUserId: subjectUserId,
        text: ctrl.newPostText,
        createdAt: new Date()
      });
      ctrl.newPostText = '';
    };

    if (ctrl.userId == loggedInUserId() && mentionedUsernames) {
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

  function taglineOrMostRecentPost( user ) {
    if (s.isBlank(user.profile.tagLine)) {
      var  mostRecentPost = Posts.findOne({authorUserId: user._id}, {sort: {createdAt : -1}});
      if (mostRecentPost) {
        return 'Latest post: ' + mostRecentPost.text;
      } else {
        return "This user's page is a blank slate.";
      }
    } else {
      return user.profile.tagLine;
    }
  };

  function listeningTo(listenee) {
    return loggedInUser() && loggedInUser().profile.listeneeUserIds.indexOf(listenee._id) != -1;
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
    var listeneeUserIds = loggedInUser().profile.listeneeUserIds;
    if (listeningTo(listenee)) {
      listeneeUserIds = _.without(listeneeUserIds, listenee._id);
    } else {
      listeneeUserIds.unshift(listenee._id);
    }
    Meteor.users.update( Meteor.userId(), {$set: { "profile.listeneeUserIds": listeneeUserIds }} );
    loggedInUser().profile.listeneeUserIds = listeneeUserIds;
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }
  };

  function generateUsernameOnTheFly(scope, formName) {
    var ctrl = this;

    ctrl[formName] = {};

    scope.$watch('vm.name', function() {
      if (ctrl[formName] && ctrl[formName].username && ctrl[formName].username.$pristine && ctrl.name && ctrl.name.length > 0) {
        ctrl.username = "@" + ctrl.name.replace(/\ /g,"").toLowerCase();
      }
    }, true);
  };

  return {
    loggedInUserId: loggedInUserId,
    loggedInUser: loggedInUser,
    createPost: createPost,
    author: author,
    subject: subject,
    createdAtRelative: createdAtRelative,
    taglineOrMostRecentPost: taglineOrMostRecentPost,
    listeningTo: listeningTo,
    showProfile: showProfile,
    toggleListening: toggleListening,
    generateUsernameOnTheFly: generateUsernameOnTheFly
  };
})

;
