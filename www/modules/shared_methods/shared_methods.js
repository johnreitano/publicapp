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
