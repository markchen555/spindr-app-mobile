import React, { Component } from 'react';
import { connect } from 'react-redux';
import CountdownCircle from 'react-native-countdown-circle';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { 
  Button,
  SearchBar,
 } from 'react-native-elements';
import io from 'socket.io-client';

class Ready extends Component {
  constructor(props){
    super(props)
    this.state = {
      srms: []
    }
  }

  componentDidMount(){
    console.log('ready mounted')
    this.socket = io('http://13.57.52.97:3000');
    this.socket.on('roomReady', (room) => {
      console.log('roomready is working', room)
      this.socket.emit('inHolding', this.props.userId, room);
      //for testing:
      this.socket.emit('inHolding', 3000);
      this.socket.emit('inHolding', 3001);
      this.socket.emit('inHolding', 3002);
      // this.socket.emit('inHolding', 3003);
      // this.socket.emit('inHolding', 3004);

      this.socket.on('readyWaiting', room => {
        console.log(room)
        this.setState({srms: room})
      });
      this.socket.on('vidReady', unique => {
        console.log ('unique rooms', unique)
      })
    })
  }

  render(){
    const { navigate } = this.props.navigation;
    console.log('this is ready component; ', this.state.srms)
    return (
      <View style={styles.container}>
        <StatusBar barStyle='light-content'/>
        <Text>
          Waiting for users to join.
          {this.state.srms.length > 0 ? <CountdownCircle
           seconds={5}
           radius={30}
           borderWidth={8}
           color="#ff003f"
           bgColor="#fff"
           textStyle={{ fontSize: 20 }}
           onTimeElapsed={() => navigate('Video')}
          /> : null}
        </Text>
      </View>
    )
  }
}

const InHoldingState = (store) => {
  return {
    userId: store.Auth.userId
  }
}

const styles = StyleSheet.create({ 
  container: {
    flex: 1, 
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#F5FCFF',
  },
  
})

export default connect(InHoldingState, null)(Ready);