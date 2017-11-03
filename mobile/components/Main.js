import React, { Component } from 'react';
import { connect } from 'react-redux';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  Image, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Animated, 
  Dimensions,
  Easing } from 'react-native';
import { Button } from 'react-native-elements';
import axios from 'axios';
import Icon from 'react-native-vector-icons/dist/FontAwesome'

const { width, height } = Dimensions.get('window');
const size = Math.min(width, height) - 1;

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: {},
      fake: {
        "id": "3",
        "sex" : "m",
        "social_score": "10",
        "interests": ["b", "c"],
        "match_social_score": "10",
        "match_interests": "45",
        "match_weighted_interests": {"a": 0.2, "b":0.3}
      },
      scale: new Animated.Value(0)
    }
  }

  animateOnPress = () => {
    Animated.timing(this.state.scale, {
      toValue: 3,
      duration: 400,
      top: -50,
      easing: Easing.linear
    }).start(() => {
      this.setState({
        scale: new Animated.Value(0.1)
      });
      this.props.navigation.navigate('Ready');
    });
  }
  

  // readyToPlay = () => {
  //   axios.get(`http://13.57.52.97:3000/api/userId/${this.props.userId}`)
  //   .then(info => {
  //     this.setState({ userInfo : this.state.fake });
  //     console.log('UserInfo:', this.state.userInfo);
  //   })
  //   .then(() => {
  //     this.postToFlask();1
  //   })
  //   .catch(err => {
  //     console.log('Fetch err:', err);
  //   })
  // }
  // //
  // postToFlask = () => {
  //   console.log('im in posttoflask', this.state.userInfo)
  //   axios.post('http://54.153.58.44:5000/',  this.state.userInfo, {
  //     headers: {
  //       'Content-Type': 'application/json'
  //     }})
  //   .then(() => {
  //     console.log('Posted to flask:', this.state.userInfo);
  //   })
  //   .catch(err => {
  //     console.log('posttoflask err', err);
  //   })
  // }

  render() {
    const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        <StatusBar barStyle='light-content'/>
        <Animated.View style={{
          position: 'absolute',
          backgroundColor: 'rgba(255, 139, 0, 0.4);',
          top: 70,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{
            scale: this.state.scale
          }]
        }} />
        {/* <TouchableWithoutFeedback  onPress = {() => {this.readyToPlay(), this.animateOnPress()}}> */}
        <TouchableWithoutFeedback  onPress = {() => { this.animateOnPress()}}>
          <Image
          style={styles.join}
          source={require('../images/Join.png')}
          />
        </TouchableWithoutFeedback>
        <View style={styles.btnSection}>
          <TouchableOpacity
            onPress = {() => navigate('Matches')}
            style={styles.btnMatches}
          >
            <Icon name={"venus-mars"}  size={35} color="#FF5A5F" />
          </TouchableOpacity>
          <TouchableOpacity
          onPress = {() => navigate('Profile')}
          style={styles.btnProfile}
          >
            <Icon name={"user-circle"}  size={35} color="#FF5A5F" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',    
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  readyBtn: {
    borderRadius: 100,
  },
  join: {
    alignItems: 'center',
    marginTop: 50,
    width: 200, 
    height: 200
  },
  btnSection: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 60,
  },
  btnMatches: {
    alignItems:'center',
    justifyContent:'center',
    width:80,
    height:80,
    backgroundColor:'#fff',
    borderRadius:100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 1,
    marginLeft: 5,
    marginRight: 45,
  },
  btnProfile: {
    alignItems:'center',
    justifyContent:'center',
    width:80,
    height:80,
    backgroundColor:'#fff',
    borderRadius:100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 1,
    marginLeft: 45,
    marginRight: 5,
  }
});

const mainState = (store) => {
  return {
    userId: store.Auth.userId,
  }
}

export default connect(mainState, null)(Main);
