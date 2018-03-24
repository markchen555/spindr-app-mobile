import React, { Component } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, Dimensions, TouchableOpacity} from 'react-native';
import { 
  Button,
  SearchBar,
 } from 'react-native-elements';
 import Icon from 'react-native-vector-icons/dist/FontAwesome'

let {height, width} = Dimensions.get('window');

class Like extends Component {
  render() {
    const { navigate } = this.props.navigation;
    console.log('this is like width: ',width)
    return (
      <View style={styles.container}>
        <StatusBar
        barStyle='light-content'/>
        <View style={styles.bannerSection}>
          <Image
            resizeMode="contain"
            style={styles.banner}
            source={require('../images/Banner.png')}
          />
        </View>
        <View style={styles.textSection}>
          <Text style={styles.textTitle}>Session End</Text>
          <Text style={styles.textInfo}>How do you feel about this person?</Text>
        </View>
        <View style={styles.btnSection}>
          <TouchableOpacity
          onPress = {() => navigate('Main')}
          style={styles.btnX}
          >
            <Icon name={"times"}  size={35} color="#FF5A5F" />
          </TouchableOpacity>
          <TouchableOpacity
          onPress = {() => navigate('Main')}
          style={styles.btnHeart}
          >
            <Icon name={"heart-o"}  size={35} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerSection: {
    flex: 2,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginTop: -118,
  },
  banner: {
    width: width,
  },
  textSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  textTitle: {
    textAlign: 'center',
    fontSize: 20,
    color: '#888888',
    opacity: 0.9,
  },
  textInfo: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#4A4A4A',
    width: 270,
    opacity: 0.9,
  },
  btnSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 80,
  },
  btnX: {
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
  btnHeart: {
    alignItems:'center',
    justifyContent:'center',
    width:80,
    height:80,
    backgroundColor:'#FF5A5F',
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

export default Like;