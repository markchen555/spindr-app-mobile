'use strict';

import React, { Component } from 'react';
import CountdownCircle from 'react-native-countdown-circle'
import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  TextInput,
  ListView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';

import { 
  Button,
  SearchBar,
 } from 'react-native-elements';

import io from 'socket.io-client';

const socket = io.connect('https://react-native-webrtc.herokuapp.com', {transports: ['websocket']});

const window = Dimensions.get('window');

import {
  RTCPeerConnection,
  RTCMediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStreamTrack,
  getUserMedia,
} from 'react-native-webrtc';

// import LikeDislike from './LikeDislike'

const configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

const pcPeers = {};
let localStream;

function getLocalStream(isFront, callback) {
  let videoSourceId;
  // on android, you don't have to specify sourceId manually, just use facingMode
  // uncomment it if you want to specify
  if (Platform.OS === 'ios') {
    MediaStreamTrack.getSources(sourceInfos => {
      console.log("sourceInfos: ", sourceInfos);

      for (const i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if(sourceInfo.kind == "video" && sourceInfo.facing == (isFront ? "front" : "back")) {
          videoSourceId = sourceInfo.id;
        }
      }
    });
  }
  getUserMedia({
    audio: true,
    video: {
      mandatory: {
        minWidth: 640, // Provide your own width, height and frame rate here
        minHeight: 360,
        minFrameRate: 30,
      },
      facingMode: (isFront ? "user" : "environment"),
      optional: (videoSourceId ? [{sourceId: videoSourceId}] : []),
    }
  }, function (stream) {
    console.log('getUserMedia success', stream);
    callback(stream);
  }, error => {
    console.log("getUserMedia error", error);
  });
}

function join(roomID) {
  socket.emit('join', roomID, function(socketIds){
    console.log('join', socketIds);
    for (const i in socketIds) {
      const socketId = socketIds[i];
      createPC(socketId, true);
    }
  });
}

function createPC(socketId, isOffer) {
  const pc = new RTCPeerConnection(configuration);
  pcPeers[socketId] = pc;

  pc.onicecandidate = function (event) {
    console.log('onicecandidate', event.candidate);
    if (event.candidate) {
      socket.emit('exchange', {'to': socketId, 'candidate': event.candidate });
    }
  };

  function createOffer() {
    pc.createOffer(function(desc) {
      console.log('createOffer', desc);
      pc.setLocalDescription(desc, function () {
        console.log('setLocalDescription', pc.localDescription);
        socket.emit('exchange', {'to': socketId, 'sdp': pc.localDescription });
      }, error => {
        console.log("setLocalDescription error", error);
      });
    }, error => {
      console.log("createOffer error", error);
    });
  }

  pc.onnegotiationneeded = function () {
    console.log('onnegotiationneeded');
    if (isOffer) {
      createOffer();
    }
  }

  pc.oniceconnectionstatechange = function(event) {
    console.log('oniceconnectionstatechange', event.target.iceConnectionState);
    if (event.target.iceConnectionState === 'completed') {
      setTimeout(() => {
        getStats();
      }, 1000);
    }
    if (event.target.iceConnectionState === 'connected') {
      createDataChannel();
    }
  };
  pc.onsignalingstatechange = function(event) {
    console.log('onsignalingstatechange', event.target.signalingState);
  };

  pc.onaddstream = function (event) {
    console.log('onaddstream', event.stream);
    container.setState({info: 'One peer join!'});

    const remoteList = container.state.remoteList;
    remoteList[socketId] = event.stream.toURL();
    container.setState({ remoteList: remoteList });
  };
  pc.onremovestream = function (event) {
    console.log('onremovestream', event.stream);
  };

  pc.addStream(localStream);
  function createDataChannel() {
    if (pc.textDataChannel) {
      return;
    }
    const dataChannel = pc.createDataChannel("text");

    dataChannel.onerror = function (error) {
      console.log("dataChannel.onerror", error);
    };

    dataChannel.onmessage = function (event) {
      console.log("dataChannel.onmessage:", event.data);
      container.receiveTextData({user: socketId, message: event.data});
    };

    dataChannel.onopen = function () {
      console.log('dataChannel.onopen');
      container.setState({textRoomConnected: true});
    };

    dataChannel.onclose = function () {
      console.log("dataChannel.onclose");
    };

    pc.textDataChannel = dataChannel;
  }
  return pc;
}

function exchange(data) {
  const fromId = data.from;
  let pc;
  if (fromId in pcPeers) {
    pc = pcPeers[fromId];
  } else {
    pc = createPC(fromId, false);
  }

  if (data.sdp) {
    console.log('exchange sdp', data);
    pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
      if (pc.remoteDescription.type == "offer")
        pc.createAnswer(function(desc) {
          console.log('createAnswer', desc);
          pc.setLocalDescription(desc, function () {
            console.log('setLocalDescription', pc.localDescription);
            socket.emit('exchange', {'to': fromId, 'sdp': pc.localDescription });
          }, error => {
            console.log("setLocalDescription error", error);
          });
        }, error => {
          console.log("createAnswer error", error);
        });
    }, error => {
      console.log("setRemoteDescription error", error);
    });
  } else {
    console.log('exchange candidate', data);
    pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
}

function leave(socketId) {
  console.log('leave', socketId);
  const pc = pcPeers[socketId];
  const viewIndex = pc.viewIndex;
  pc.close();
  delete pcPeers[socketId];
  console.log('remoteList before: ', container.state.remoteList)

  const remoteList = container.state.remoteList;
  delete remoteList[socketId]

  console.log('remoteList After: ', container.state.remoteList)
  // container.setState({ remoteList: remoteList, info: 'One peer leave!' });
  container.setState({ remoteList: remoteList });
  container.setState({info: 'One peer leave!'});
}

socket.on('exchange', function(data){
  exchange(data);
});
socket.on('leave', function(socketId){
  leave(socketId);
});

socket.on('connect', function(data) {
  console.log('connect');
  container.getLocalStream(true, function(stream) {
    localStream = stream;
    container.setState({selfViewSrc: stream.toURL(), status: 'ready', info: 'Please enter or create room ID'});
    // container.setState({selfViewSrc: stream.toURL()});
    // container.setState({status: 'ready', info: 'Please enter or create room ID'});
  });
});

function mapHash(hash, func) {
  const array = [];
  for (const key in hash) {
    const obj = hash[key];
    array.push(func(obj, key));
  }
  return array;
}

function getStats() {
  const pc = pcPeers[Object.keys(pcPeers)[0]];
  if (pc.getRemoteStreams()[0] && pc.getRemoteStreams()[0].getAudioTracks()[0]) {
    const track = pc.getRemoteStreams()[0].getAudioTracks()[0];
    console.log('track', track);
    pc.getStats(track, function(report) {
      console.log('getStats report', report);
    }, error => {
      console.log("getStats error", error);
    });
  }
}

let container;

export default class Video extends Component {
  constructor(props) {
    super(props);
    this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => true});
    this.state = {
      info: 'Initializing',
      status: 'init',
      roomID: '',
      isFront: true,
      selfViewSrc: null,
      remoteList: {},
      textRoomConnected: false,
      textRoomData: [],
      textRoomValue: '',
    }
    this._press = this._press.bind(this);
    this._renderTextRoom = this._textRoomPress.bind(this);
  }

  componentDidMount() {
    container = this;
  }

  _press(event) {
    this.refs.roomID.blur();
    this.setState({status: 'connect', info: 'Connecting'});
    join(this.state.roomID);
  }

  // _switchVideoType() {
  //   const isFront = !this.state.isFront;
  //   this.setState({isFront});
  //   getLocalStream(isFront, function(stream) {
  //     if (localStream) {
  //       for (const id in pcPeers) {
  //         const pc = pcPeers[id];
  //         pc && pc.removeStream(localStream);
  //       }
  //       localStream.release();
  //     }
  //     localStream = stream;
  //     container.setState({selfViewSrc: stream.toURL()});

  //     for (const id in pcPeers) {
  //       const pc = pcPeers[id];
  //       pc && pc.addStream(localStream);
  //     }
  //   });
  // }

  receiveTextData(data) {
    const textRoomData = this.state.textRoomData.slice();
    textRoomData.push(data);
    this.setState({textRoomData, textRoomValue: ''});
  }

  _textRoomPress() {
    if (!this.state.textRoomValue) {
      return
    }
    const textRoomData = this.state.textRoomData.slice();
    textRoomData.push({user: 'Me', message: this.state.textRoomValue});
    for (const key in pcPeers) {
      const pc = pcPeers[key];
      pc.textDataChannel.send(this.state.textRoomValue);
    }
    this.setState({textRoomData, textRoomValue: ''});
  }

  _renderTextRoom() {
    return (
      <View style={styles.listViewContainer}>
        <ListView
          dataSource={this.ds.cloneWithRows(this.state.textRoomData)}
          renderRow={rowData => <Text>{`${rowData.user}: ${rowData.message}`}</Text>}
          />
        <TextInput
          style={{width: 200, height: 30, borderColor: 'gray', borderWidth: 1}}
          onChangeText={value => this.setState({textRoomValue: value})}
          value={this.state.textRoomValue}
        />
        <Button
        title="Send"
        onPress={this._textRoomPress}>
          <Text>Send</Text>
        </Button>
      </View>
    );
  }

  _timeOut(){
    this.setState({roomID: ''});
    this.setState({roomID: 'Test2'})
    join(this.state.roomID);
  }

  render() {
    console.log('this is window screen size: ', window.width, window)
    console.log('this is remotelist: ', this.state.remoteList)
    console.log('this is state: ', this.state)
    return (
      <ScrollView contentContainerStyle={styles.container}>
       { this.state.status == 'ready' ? (
        <RTCView streamURL={this.state.selfViewSrc} style={styles.selfView}>
           <Text style={styles.welcome}>
            {this.state.info}
          </Text >
          <View style={styles.roomInputSection}>
            <SearchBar
              ref='roomID'
              noIcon
              lightTheme
              placeholder='Type Here...'
              autoCorrect={false}
              style={styles.roomInput}
              onChangeText={(text) => this.setState({roomID: text})}
              value={this.state.roomID}
            />
            <Button title='Enter room'
              onPress={this._press}>
              <Text>Enter room</Text>
            </Button>
          </View>
        </RTCView>
       ) : (
        <View style={styles.remoteViewSection}>
         <Text style={styles.welcome}>
           {this.state.info}
           {this.state.info == 'One peer join!' ? <CountdownCircle
           seconds={5}
           radius={30}
           borderWidth={8}
           color="#ff003f"
           bgColor="#fff"
           textStyle={{ fontSize: 20 }}
           /* onTimeElapsed={this._timeOut.bind(this)} */
       /> : null}
         </Text>
        {this.state.info === 'One peer leave!' ? 
        <RTCView streamURL={container.state.selfViewSrc} style={styles.selfView}/>
        :
         mapHash(this.state.remoteList, function(remote, index) {
           return (
           <RTCView key={index} streamURL={remote} style={styles.remoteView}>
             <RTCView streamURL={container.state.selfViewSrc} style={styles.selfViewConnected}/>
           </RTCView>
           )
         })
       }
       </View>
      )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  viewSection: {
    flex: 1,
  },
  selfView: {
    flex: 1,
  },
  selfViewConnected: {
    flex:1,
    top: '35%',
    width: '25%',
    margin: 10,
  },
  remoteView: {
   flex:1,
  },
  remoteViewSection: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
    backgroundColor: "transparent",
  },
  cameraInfo:{
    textAlign: 'center',
    margin: 10,
  },
  listViewContainer: {
    height: 150,
  },
  roomInputSection: {
    flexDirection: 'row',
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInput: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

/*

<ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcome}>
          {this.state.info}
        </Text >
        {this.state.textRoomConnected && this._renderTextRoom()}
        <View>
          <Text style={styles.cameraInfo}>
            {this.state.isFront ? "Use front camera" : "Use back camera"}
          </Text>
        </View>
        <View>
          <Button title='Switch camera'
            raised
            icon={{name: 'cached'}}
            onPress={this._switchVideoType.bind(this)}>
            <Text>Switch camera</Text>
          </Button>
        </View>
        { this.state.status == 'ready' ?
          (<View style={styles.roomInputSection}>
            <SearchBar
              ref='roomID'
              noIcon
              lightTheme
              placeholder='Type Here...'
              autoCorrect={false}
              style={styles.roomInput}
              onChangeText={(text) => this.setState({roomID: text})}
              value={this.state.roomID}
            />
            <Button title='Enter room'
              onPress={this._press.bind(this)}>
              <Text>Enter room</Text>
            </Button>
          </View>) : null
        }
        <View style={styles.viewSection}>
          <RTCView streamURL={this.state.selfViewSrc} style={styles.selfView}>
            {
              mapHash(this.state.remoteList, function(remote, index) {
                return <RTCView key={index} streamURL={remote} style={styles.remoteView}/>
              })
            }
          </RTCView>
        </View>
      </ScrollView>
*/
