(async () => {

    // GET HTML ELEMENTS
    const loginPage = document.querySelector('#login-page');
    const usernameInput = document.querySelector('#username');
    const loginButton = document.querySelector('#login');
    const callPage = document.querySelector('#call-page');
    const theirUsernameInput = document.querySelector('#their-username');
    const callButton = document.querySelector('#call');
    const hangUpButton = document.querySelector('#hang-up');
    const yourVideo = document.querySelector("#yours");
    const theirVideo = document.querySelector("#theirs");
    const otherVideo = document.querySelector("#others");
    
    callPage.style.display = "none";
    
    var peerConnections={};
    
    const connection = new WebSocket('wss://' + window.location.href.slice(8, window.location.href.length));
    
    // GET MEDIA DEVICES
    
    if (!("mediaDevices" in navigator) || !("RTCPeerConnection" in window)) {
    alert("Sorry, your browser does not support WebRTC.");
    return;
    }
    
    const configuration = {
    iceServers: [
    {
    urls: "stun:stun.relay.metered.ca:80",
    },
    {
    urls: "turn:a.relay.metered.ca:80",
    username: "4a4ce13533e312eede710b26",
    credential: "WFLIOlBlYV5ZUlEZ",
    },
    
    {
    urls: "turn:a.relay.metered.ca:443",
    username: "4a4ce13533e312eede710b26",
    credential: "WFLIOlBlYV5ZUlEZ",
    },
    {
    urls: "turn:a.relay.metered.ca:443?transport=tcp",
    username: "4a4ce13533e312eede710b26",
    credential: "WFLIOlBlYV5ZUlEZ",
    },
    ],
    }
    
    // INIT YOURS
    // const localstream = new RTCPeerConnection(configuration);
    
    const stream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
    /*
    for (const track of stream.getTracks()) {
    localstream.addTrack(track, stream);
    } */
    
    yourVideo.srcObject = stream;
    
    
    
    
    
    /* yours.addEventListener('track', (e) => {
    
    if (e.streams?.length) {
    console.log("arriva track ");
    console.dir(e);
    // console.dir("their" + theirVideo);
    // console.dir("other "+ otherVideo);
    theirVideo.srcObject = e.streams[0];
    
    }
    })
    
    yours.onicecandidate = e => {
    if (e.candidate) {
    myCandidate =e.candidate;
    const theirUsername = theirUsernameInput.value;
    console.log('invio candaidate a '+theirUsername);
    console.log('SEND CANDIDATE', e.candidate);
    send({
    type: 'candidate',
    candidate: e.candidate,
    name: theirUsername
    })
    }
    }
    
    */
    // ADD LISTENERS
    
    function addPeerListener(peerconnection){
    
    peerconnection.addEventListener('track', (e) => {
    
    if (e.streams?.length) {
    console.log("arriva track ");
    console.dir(e);
    // console.dir("their" + theirVideo);
    // console.dir("other "+ otherVideo);
    theirVideo.srcObject = e.streams[0];
    
    }
    })
    
    peerconnection.onicecandidate = e => {
    if (e.candidate) {
    
    const theirUsername = theirUsernameInput.value;
    console.log('invio candaidate a '+theirUsername);
    console.log('SEND CANDIDATE', e.candidate);
    send({
    type: 'candidate',
    candidate: e.candidate,
    name: theirUsername,
    sender: theirUsernameInput.value
    })
    }
    }
    
    }
    
    loginButton.addEventListener('click', () => {
    const username = usernameInput.value;
    if (username) {
    console.log('SEND LOGIN', username);
    send({
    type: "login",
    name: username
    });
    }
    
    });
    
    callButton.addEventListener('click', async () => {
    const theirUsername = theirUsernameInput.value;
    if (theirUsername) {
    const theirUsername = theirUsernameInput.value;
    
    peerConnections[theirUsername]=new RTCPeerConnection(configuration);
    addPeerListener(peerConnections[theirUsername]);
    
    const offer = await peerConnections[theirUsername].createOffer();
    await peerConnections[theirUsername].setLocalDescription(offer);
    
    
    
    console.log('SEND OFFER', offer, theirUsername);
    send({
    type: "offer",
    offer: offer,
    name: theirUsername,
    sender: usernameInput.value
    });
    }
    });
    
    
    hangUpButton.addEventListener('click', async() => {
    const theirUsername = theirUsernameInput.value;
    const username = usernameInput.value;
    console.log('SEND Hang UP');
    send({
    type: "leave",
    name: theirUsername,
    theirusername: username
    
    
    });
    
    
    });
    
    const onLogin = (success) => {
    console.log('ON LOGIN', success);
    loginPage.style.display = "none";
    callPage.style.display = "block";
    };
    
    const onOffer = async (offer,name,sender) => {
    console.log('ON OFFER '+sender);
    console.dir(offer);
    
    // if (offer && offer.sender) {
    
    peerConnections[sender]=new RTCPeerConnection(configuration);
    await peerconnection[sender].setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await peerconnection[sender].createAnswer();
    await peerconnection[sender].setLocalDescription(answer);
    
    console.log('SEND ANSWER', answer);
    send({
    type: 'answer',
    answer: answer,
    name: sender,
    sender: name
    
    
    })
    
    // } else {
    // console.warn('OFFER UNDEFINED')
    // }
    };
    
    const onAnswer = async (answer,name,sender) => {
    console.log('ON ANSWER', answer);
    
    if (answer) {
    await peerconnection[sender].setRemoteDescription(new RTCSessionDescription(answer));
    
    } else {
    console.warn('ANSWER UNDEFINED')
    }
    };
    
    const onCandidate = (candidate, name) => {
    console.log('ON CANDIDATE', candidate);
    
    if (candidate) {
    peerconnection[name].addIceCandidate(candidate);
    } else {
    console.warn('CANDIDATE UNDEFINED')
    }
    };
    
    const onLeave = () => {
    
    yours.close();
    
    theirVideo.srcObject=null;
    yourVideo.srcObject=null;
    
    
    };
    
    
    connection.onopen = () => {
    console.log('CONNECTED');
    };
    connection.onerror = (e) => {
    console.error(e);
    };
    connection.onmessage = (message) => {
    const data = JSON.parse(message.data);
    switch (data.type) {
    case "login":
    onLogin(data.success);
    break;
    case "offer":
    onOffer(data.offer, data.name,data.sender);
    break;
    case "answer":
    onAnswer(data.answer,data.name,data.sender);
    break;
    case "candidate":
    onCandidate(data.candidate,data.name,data.sender);
    break;
    case "leave":
    onLeave();
    break;
    default:
    break;
    }
    };
    
    function send(message) {
    connection.send(JSON.stringify(message));
    };
    
    })();