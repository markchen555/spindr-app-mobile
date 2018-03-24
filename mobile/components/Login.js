import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavigationActions } from 'react-navigation';
import { bindActionCreators } from 'redux';
import { View, Text, StyleSheet, Button, Image, StatusBar, Animated, Easing } from 'react-native';
import FBSDK, { LoginButton, AccessToken } from 'react-native-fbsdk';
import AWS, { Config, CognitoIdentityCredentials } from 'aws-sdk';

import * as authActions from '../actions/authActions';

class Login extends Component {
  constructor(props) {
    super(props);
    this.spinValue = new Animated.Value(0)
  }

  componentDidMount() {
    this.props.actions.fbLogin();
    this.spin();
  }

  spin () {
    this.spinValue.setValue(0)
    Animated.timing(
      this.spinValue,
      {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear
      }
    ).start(() => this.spin())
  }

  // resetNavigation = (targetRoute) => {
  //   const resetAction = NavigationActions.reset({
  //     index: 0,
  //     actions: [
  //       NavigationActions.navigate({ routeName: targetRoute }),
  //     ],
  //   });
  //   this.props.navigation.dispatch(resetAction);
  // }


  render() {
    const spin = this.spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    })
    return (
      <View style={styles.container}>
        <StatusBar
        barStyle='light-content'/>
        <View style={styles.textSection}>
          <Animated.Image
          style={{
          width: 110,
          height: 110,
          transform: [{rotate: spin}] }}
          source={require('../images/Login_Logo.png')}
      />
          <Text style={styles.textTitle}>Get Started</Text>
          <Text style={styles.textInfo}>Please log in with your Facebook account.</Text>
        </View>
        <LoginButton 
          style={styles.loginBtn}
          readPermissions={["email", "public_profile"]}
          onLoginFinished={
            (error, result) => {
              if (error) {
                console.log("Login failed with error: " + error.message);
              } else if (result.isCancelled) {
                console.log("Login was cancelled"); 
              } else {
                this.props.actions.fbLogin();
                console.log("Login was successful with permissions: " + result.grantedPermissions)
              }
            }
          }
          onLogoutFinished={
            (error, result) => {
              if (error) {
                console.log("Logout failed with error: " + error.message);
              } else {
                this.props.actions.logout();
              }
            }
          }/>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  textSection: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  loginTitle: {
    alignItems: 'center',
  },
  textTitle: {
    textAlign: 'center',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 50,
    color: '#4A4A4A',
    opacity: 0.9,
  },
  textInfo: {
    textAlign: 'center',
    fontSize: 20,
    marginTop: 10,
    color: '#888888',
    width: 250,
    opacity: 0.8,
  },
  logo: {
    alignItems: 'center',
    marginTop: 30,
    width: 110, 
    height: 110
  },
  loginBtn: {
    width: 300,
    height: 50,
  }
});

const loginDispatch = (dispatch) => {
  return {
    actions: bindActionCreators(authActions, dispatch)
  }
};

export default connect(null, loginDispatch)(Login);

