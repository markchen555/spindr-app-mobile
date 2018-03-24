## Spindr App Mobile Project V1.0

### Spindr 

---

### Set up the environment 

For iOS environment

1. make sure you have Xcode and command line tool installed

For Android environment

1. Install [Java SE](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) 
2. Install [Android Studio](https://developer.android.com/studio/index.html) installed
3. Install [Oracle VM VirtualBox](https://www.virtualbox.org/wiki/Downloads) 
4. Register and install [Genymotion](https://www.genymotion.com/download)
5. add the following code to `~/.bash_profile` file
```
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```
if you have `Oh-My-Zsh` installed
you need to also add the code to `~/.zshrc`
6. Launch Genomotion and add a virtual devices
7. Go to Genomotion `Settings` and click on `ADB` tab, select `Use custom Android SDK tools` and input the Android Studio SDK location. 
   * Usuall Android Studio SDK location is `/Users/YOUR_COMPUTER_NAME/Library/Android/sdk`.
   * You can also find the Android Studio SDK location in Android Studio SDK manager.

---

### To run the application

[Project Repo](https://github.com/theFlowerPetals/spindr-app-mobile
)

Fork a copy from github or download the repository on your computer, unzip it and launch the terminal at the root directory of the folder.

1. Run `npm install` to install all dependency to your local machine.
2. Run `npm start` to activate emulate selection screen.
   * Connect your iphone and Run Build in Xcode if you want to emulate on iPhone
   * Run `react-native run-ios` if you want to emulate in iOS.
   * Run `react-native run-android` if you want to emulate in Android

---

### Spindr App Mobile Project V1.0 Info

The Spindr App Mobile uses React-Native for frontend framework and Expo for emulation. 

---

### Reference

- [React-Native](https://facebook.github.io/react-native/)

---

### License

The project is licensed under the [MIT license](license.txt).


