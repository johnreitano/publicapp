Ionic App Base
=====================

A starting project for Ionic that optionally supports using custom SCSS.

## Using this project

We recommend using the [Ionic CLI](https://github.com/driftyco/ionic-cli) to create new Ionic projects that are based on this project but use a ready-made starter template.

For example, to start a new Ionic project with the default tabs interface, make sure the `ionic` utility is installed:

```bash
$ npm install -g ionic
```

Then run:

```bash
$ ionic start myProject tabs
```

More info on this can be found on the Ionic [Getting Started](http://ionicframework.com/getting-started) page and the [Ionic CLI](https://github.com/driftyco/ionic-cli) repo.

## Issues
Issues have been disabled on this repo, if you do find an issue or have a question consider posting it on the [Ionic Forum](http://forum.ionicframework.com/).  Or else if there is truly an error, follow our guidelines for [submitting an issue](http://ionicframework.com/submit-issue/) to the main Ionic repository.


cordova build --release android

keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore /Users/John/Documents/Public/my-release-key.keystore /Users/John/dev/publicapp2/platforms/android/build/outputs/apk/android-release-unsigned.apk alias_name

rm /Users/John/dev/publicapp2/platforms/android/build/outputs/apk/Public.apk

/usr/local/opt/android-sdk/build-tools/23.0.2/zipalign -v 4 /Users/John/dev/publicapp2/platforms/android/build/outputs/apk/android-release-unsigned.apk /Users/John/dev/publicapp2/platforms/android/build/outputs/apk/Public.apk

open /Users/John/dev/publicapp2/platforms/android/build/outputs/apk/

ls /Users/John/dev/publicapp2/platforms/android/build/outputs/apk/Public.apk
