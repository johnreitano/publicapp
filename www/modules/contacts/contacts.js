angular.module('Publicapp.contacts', [])

  .factory('Contacts', function($timeout, $cordovaContacts) {

    var contacts = null;

    var userAssociatedWithContact = function(contact) {
      // TODO: finish this method
      return null;
    };

    var load = function(callback) {
      if (!ionic.Platform.isWebView()) {
        contacts = [];
        return;
      }

      console.log('retrieving contacts');
      var startTime = new Date();
      var options = {
        filter: "",
        multiple: true,
        fields:  [ 'displayName', 'name' ]
      };
      $cordovaContacts.find(options).then(function onSuccess(rawContacts) {
        var endTime = new Date();
        contacts = _.filter(rawContacts, function(contact) {return !s.isBlank(contact.displayName); });
        _.each(contacts, function(contact) { contact.user = userAssociatedWithContact(contact); });
        var elapsedSeconds = ( endTime - startTime ) / 1000;
        console.log("loaded " + contacts.length + " contacts in " + elapsedSeconds + " seconds");
      },
      function onError(contactError) {
        contacts = [];
        console.log('error retrieving contacts!', contactError);
      });
    };

    var get = function(contactsDataCallback) {
      var callCallback;
      callCallback = function() {
        if (contacts) {
          contactsDataCallback(contacts);
        } else {
          $timeout( callCallback, 500 ); // give load method another half second to complete
        }
      };
      $timeout( callCallback, 0 );
    };

    return {
      load: load,
      get: get
    };

  })

;


