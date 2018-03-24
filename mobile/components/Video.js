import React, { Component } from 'react';
import CountdownCircle from 'react-native-countdown-circle'
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as videoActions from '../actions/videoActions';
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
  StatusBar
} from 'react-native';

import { 
  Button,
  SearchBar,
 } from 'react-native-elements';

import io from 'socket.io-client';

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

class Video extends Component {
  constructor(props) {
    super(props);
    this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => true});
    this.state = {
      info: 'Initializing',
      status: 'init',
      username: this.props.username,
      roomID: '',
      isFront: true,
      selfViewSrc: null,
      remoteList: {},
      textRoomConnected: false,
      textRoomData: [],
      textRoomValue: '',
      configuration: {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]},
      pcPeers: {},
      to: null,
      from: null,
      countDown: true,
      lobby: {},
    }
    this.socket = io.connect('https://react-native-webrtc.herokuapp.com', {transports: ['websocket']});
    this.localStream = null;
    this._timeOut = this._timeOut.bind(this)
  }

  componentDidMount() {
    container = this;
    
    // console.log('this is this before in cdm: ', this.state)
    // this.setState({remoteList: {}, pcPeers: {}, from: null, to: null, info: 'Initializing', roomID: '', textRoomConnected: false, status: 'init'})
    // console.log('this is this after in cdm: ', this.state)


    // this.socket.on('connect', function(data) {
    //   console.log('this is connect data: ', data)
    console.log('This is checking getLocalStream: ', container)
      container.getLocalStream(true, function(stream) {
        console.log('this is stream: ', stream)
        container.localStream = stream;
        // container.setState({selfViewSrc: stream.toURL(), status: 'ready', info: 'Please enter or create room ID'});
        container.setState({selfViewSrc: stream.toURL()});
        container.setState({status: 'ready', info: 'Please enter or create room ID'});
      });
    // });

    this.socket.on('exchange', function(data){
      console.log('this is exchange data: ', data)
      container.state.to = data.to;
      container.state.from = data.from;
      console.log('this is to and from in state: ', container.state.to, container.state.from)
      
      container.exchange(data);
    });
    this.socket.on('leave', function(socketId){
      container.leave(socketId);
    });

  }

  getLocalStream = (isFront, callback) => {
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

  join = (roomID) => {
    this.socket.emit('join', roomID, function(socketIds){
      console.log('join', socketIds);
      for (const i in socketIds) {
        const socketId = socketIds[i];
        container.createPC(socketId, true);
      }
    });
  }

  createPC = (socketId, isOffer) => {
    const pc = new RTCPeerConnection(this.state.configuration);
    this.state.pcPeers[socketId] = pc;

    console.log('this is pcPeer: ', this.state.pcPeers)
  
    pc.onicecandidate = function (event) {
      console.log('onicecandidate', event.candidate);
      if (event.candidate) {
        container.socket.emit('exchange', {'to': socketId, 'candidate': event.candidate });
      }
    };
  
    function createOffer() {
      pc.createOffer(function(desc) {
        console.log('createOffer', desc);
        pc.setLocalDescription(desc, function () {
          console.log('setLocalDescription', pc.localDescription);
          container.socket.emit('exchange', {'to': socketId, 'sdp': pc.localDescription });
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
          this.getStats();
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
    
    pc.addStream(container.localStream);
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

  exchange = (data) => {
    const fromId = data.from;
    let pc;
    if (fromId in this.state.pcPeers) {
      pc = this.state.pcPeers[fromId];
    } else {
      pc = this.createPC(fromId, false);
    }
  
    if (data.sdp) {
      console.log('exchange sdp', data);
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
        if (pc.remoteDescription.type == "offer")
          pc.createAnswer(function(desc) {
            console.log('createAnswer', desc);
            pc.setLocalDescription(desc, function () {
              console.log('setLocalDescription', pc.localDescription);
              container.socket.emit('exchange', {'to': fromId, 'sdp': pc.localDescription });
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

  leave = (socketId) => {
    console.log('leave', socketId);
    const pc = this.state.pcPeers[socketId];
    // const viewIndex = pc.viewIndex;
    // pc.close();
    delete this.state.pcPeers[socketId];
    console.log('remoteList before: ', this.state.remoteList)
  
    const remoteList = this.state.remoteList;
    delete remoteList[socketId]
  
    console.log('remoteList After: ', this.state.remoteList)
    // this.setState({ remoteList: remoteList, info: 'One peer leave!' });
    this.setState({ remoteList: remoteList });
    this.setState({info: 'One peer leave!'});
  }

  mapHash = (hash, func) => {
    const array = [];
    for (const key in hash) {
      const obj = hash[key];
      array.push(func(obj, key));
    }
    return array;
  }

  getStats = () => {
    const pc = this.state.pcPeers[Object.keys(this.state.pcPeers)[0]];
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
  

  _press = (event) => {
    // this.refs.roomID.blur();
    this.setState({status: 'connect', info: 'Connecting'});
    this.join(this.state.roomID);
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
    for (const key in this.state.pcPeers) {
      const pc = this.state.pcPeers[key];
      pc.textDataChannel.send(this.state.textRoomValue);
    }
    this.setState({textRoomData, textRoomValue: ''});
  }

  // _renderTextRoom = () => {
  //   return (
  //     <View style={styles.listViewContainer}>
  //       <ListView
  //         dataSource={this.ds.cloneWithRows(this.state.textRoomData)}
  //         renderRow={rowData => <Text>{`${rowData.user}: ${rowData.message}`}</Text>}
  //         />
  //       <TextInput
  //         style={{width: 200, height: 30, borderColor: 'gray', borderWidth: 1}}
  //         onChangeText={value => this.setState({textRoomValue: value})}
  //         value={this.state.textRoomValue}
  //       />
  //       <Button
  //       title="Send"
  //       onPress={this._textRoomPress}>
  //         <Text>Send</Text>
  //       </Button>
  //     </View>
  //   );
  // }

  _timeOut(){
      container.getLocalStream(true, function(stream) {
        container.localStream = stream;
        container.setState({selfViewSrc: null,remoteList: {}})
        container.setState({selfViewSrc: stream.toURL()});
        container.setState({status: 'ready', info: 'Please enter or create room ID'});
        container.setState({status: 'connect', info: 'Connecting'});
        container.setState({roomID: 'Test2', countDown: false});
        if(container.state.roomID == 'Test2') {
          setTimeout(() => container.props.navigation.navigate('Like'), 120000);
        }
        container.join(container.state.roomID);
      });
      // this.leave(this.state.from)
      // this.setState({from: null, to: null, status: 'ready', info: 'Please enter or create room ID', roomId: '', textRoomConnected: false})

      // container.getLocalStream(true, function(stream) {
      //   container.props.navigation.navigate('Like')
      //   container.localStream = stream;
      //   container.setState({selfViewSrc: null,remoteList: {}})
      //   container.setState({selfViewSrc: stream.toURL()});
      //   container.setState({status: 'ready'});
      //   container.setState({status: 'connect', info: 'Connecting'});
      //   // call switchRooms here to set roomId
      //   container.setState({roomID: 'Test2', countDown: false});
      //     this.leave(this.state.from)
      // this.setState({from: null, to: null, status: 'ready', info: 'Please enter or create room ID', roomId: '', textRoomConnected: false})
      //   // check store's rooms.length first
      //   container.join(container.state.roomID);
      // });
       // this.leave(this.state.from)
      // this.setState({from: null, to: null, status: 'ready', info: 'Please enter or create room ID', roomId: '', textRoomConnected: false})
      console.log('this is state checking after timeout: ', this.state)
  }

  render() {
    const { navigate } = this.props.navigation;
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBar
        barStyle='light-content'/>
       { this.state.status == 'ready' ? (
        <RTCView streamURL={this.state.selfViewSrc} style={styles.selfView}>
          <Text style={styles.welcome}>
            {this.state.username}
          </Text >
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
           {this.state.info == 'One peer join!' && this.state.countDown ? <CountdownCircle
           seconds={120}
           radius={30}
           borderWidth={8}
           color="#ff003f"
           bgColor="#fff"
           textStyle={{ fontSize: 20 }}
           onTimeElapsed={() => {this._timeOut()}}
       /> : null}
         </Text>
        {this.state.info === 'One peer leave!' ? 
        <RTCView streamURL={container.state.selfViewSrc} style={styles.selfView}/>
        :
         this.mapHash(this.state.remoteList, function(remote, index) {
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

const VideoState = (store) => {
  return {
    username: store.Auth.username,
  }
};

const videoDispatch = (dispatch) => {
  return {
    actions: bindActionCreators(videoActions, dispatch)
  }
}

export default connect(VideoState, videoDispatch)(Video);