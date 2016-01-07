/*global require, CryptoJS, XMLHttpRequest, Buffer*/
var N = N || {};

/**@namespace N
 * @classDesc Namespace for Nuve.
 */
/**
 * @class N.API
 * @classDesc Server-side APIs are RESTful, provided as a Node.js module. All APIs, except N.API.init(), should not be called too frequently. These API calls carry local timestamps and are grouped by serviceID. Once the server is handling an API call from a certain serviceID, all other API calls from the same serviceID, whose timestamps are behind, would be expired or treated as invalid.<br>
We recommend that API calls against serviceID should have interval of at least 100ms. Also, it is better to retry the logic if it fails with an unexpected timestamp error.
 */
N.API = (function (N) {
    'use strict';
    var createRoom, getRooms, getRoom, deleteRoom, updateRoom, createToken, createService, getServices, getService, deleteService, getUsers, getUser, deleteUser, params, send, calculateSignature, init;

    params = {
        service: undefined,
        key: undefined,
        url: undefined,
        rejectUnauthorizedCert: undefined
    };
/**
   * @function rejectUnauthorizedCert
   * @desc This function sets rejectUnauthorized option for https requests.
<br><b>Remarks:</b><br>
This function is only needed when server is configured with untrusted certificates and you want to ignore server certificate verification against trusted CAs. Read https://nodejs.org/api/tls.html for details.
   * @memberOf N.API
   * @param {boolean} bool true or false. Default value is true.
   * @return {boolean} stored value.
   * @example
N.API.rejectUnauthorizedCert(false);
   */
    function rejectUnauthorizedCert (bool) {
        if (typeof bool === 'boolean')
            N.API.params.rejectUnauthorizedCert = bool;
        return N.API.params.rejectUnauthorizedCert;
    }
/**
   * @function init
   * @desc This function completes the essential configuration.
   * @memberOf N.API
   * @param {string} service The ID of your service.
   * @param {string} key The key of your service
   * @param {string} url The address of the machine on which the nuve runs.
   * @example
N.API.init('5188b9af6e53c84ffd600413', '21989', 'http://61.129.90.140:3000/')
   */
    init = function (service, key, url) {
        N.API.params.service = service;
        N.API.params.key = key;
        N.API.params.url = url;
    };

/**
   * @function createRoom
   * @desc This function creates a room.
   <br><b>Remarks:</b><br>
<b>options:</b>
<br>
<ul>
    <li><b>mode:</b>"hybrid" for room with mixing and forward streams; "p2p" for p2p room.</li>
    <li><b>publishLimit:</b>limiting number of publishers in the room. Value should be equal to or greater than -1. -1 for unlimited.</li>
    <li><b>userLimit:</b>limiting number of users in the room. Value should be equal to or greater than -1. -1 for unlimited.</li>
    <li><b>enableMixing:</b>control whether to enable media mixing in the room, with value choices 0 or 1.</li>
    <li><b>mediaMixing:</b>media setting for mixed stream in the room if mixing is enabled. Value should be a JSON object contains two entries: "video" and "audio". Audio entry is currently not used and should be null.</li>
    <ul>
        <li>audio: null</li>
        <li>video: maxInput, resolution, multistreaming, bitrate , bkColor, layout, avCoordinate</li>
        <ul>
            <li>maxInput is for maximum number of slots in the mix stream</li>
            <li>resolution denotes the resolution of the video size of mix stream.Valid resolution list:</li>
                <ul>
                    <li>'sif'</li>
                    <li>'vga'</li>
                    <li>'svga'</li>
                    <li>'xga'</li>
                    <li>'hd720p'</li>
                    <li>'hd1080p'</li>
                    <li>'uhd_4k'</li>
                </ul>
            <li>multistreaming(0 or 1) indicates whether the MCU mix stream outputs multiple resolutions for different devices. The additional stream's resolutions are determined by MCU according to the base resolution user specified, no customizations is allowed yet. Please see the following table for detailed mapping.</li>
            <li>bitrate indicates video bitrate of the mix stream, in Kbit unit. Default value 0, meaning that MCU could use its own calculated default value.</li>
            <li>bkColor sets the background color, supporting RGB color format: {"r":red-value, "g":green-value, "b":blue-value}.</li>
            <li>layout describes video layout in mix stream</li>
                <ul>
                    <li>"base" is the base template (choose from "void", "fluid", "lecture")</li>
                    <li>"custom" is user-defined customized video layout. Here we give out an example to show you the details of a valid customized video layout.A valid customized video layout should be a JSON string which represents an array of video layout definition. More details see [customized video layout](@ref layout) . </li>
                    <li>MCU would try to combine the two entries for mixing video if user sets both.</li>
                </ul>
            <li>avCoordinated (0 or 1) is for disabling/enabling VAD(Voice activity detection). When VAD is applied, main pane(layout id=1) will be filled with the user stream which is the most active in voice currently.</li>
        </ul>
    </ul>
</ul>
Omitted entries are set with default values.
All supported resolutions are list in the following table.
@htmlonly
<table class="doxtable">
<caption><b>Table : Resolution Mapping for Multistreaming</b></caption>
    <tbody>
    <thead>
        <tr>
            <th><b>Base resolution</b></th>
            <th><b>Available resolution list</b></th>
        </tr>
    </thead>
        <tr>
            <td>vga</td>
            <td>{width: 640, height: 480}, {width: 320, height: 240}</td>
        </tr>
         <tr>
            <td>sif</td>
            <td>{width: 320, height: 240}</td>
        </tr>
        <tr>
            <td>xga</td>
            <td>{width: 1024, height: 768}, {width: 320, height: 240}</td>
        </tr>
        <tr>
            <td>svga</td>
            <td>{width: 800, height: 600}, {width: 320, height: 240}</td>
        </tr>
        <tr>
            <td>hd720p</td>
            <td>{width: 1280, height: 720}, {width: 640, height: 360}</td>
        </tr>
        <tr>
            <td>hd1080p</td>
            <td>{width: 1920, height: 1080}, {width: 1280, height: 720}, {width: 640, height: 360}</td>
        </tr>
        <tr>
            <td>uhd_4k</td>
            <td>{width: 3840, height: 2160}, {width: 1920, height: 1080}, {width: 1280, height: 720}, {width: 640, height: 360}</td>
        </tr>
    </tbody>
</table>
@endhtmlonly
   * @memberOf N.API
   * @param {string} name Room name.
   * @param {function} callback(room) Callback function on success.
   * @param {function} callbackError(err) Callback function on error.
   * @param {json} options Room configuration.
   * @example
N.API.createRoom('myRoom',
, function (res) {
  console.log ('Room', res.name, 'created with id:', res._id);
}, function (err) {
  console.log ('Error:', err);
}, {
  mode: 'hybrid',
  publishLimit: -1,
  userLimit: 30,
  mediaMixing: {
    video: {
      maxInput: 15,
      resolution: 'hd720p',
      multistreaming: 1,
      bitrate: 0,
      bkColor: {"r":1, "g":2, "b":255},
      layout: {
        base: 'fluid',
      },
      avCoordinated: 1
    },
    audio: null
  },
});
   */
    createRoom = function (name, callback, callbackError, options, params) {

        if (!options) {
            options = {};
        }

        send(function (roomRtn) {
            var room = JSON.parse(roomRtn);
            callback(room);
        }, callbackError, 'POST', {name: name, options: options}, 'rooms', params);
    };

/**
   * @function getRooms
   * @desc This function lists the rooms in your service.
   * @memberOf N.API
   * @param {function} callback(rooms) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
N.API.getRooms(function(rooms) {
  for(var i in rooms) {
    console.log('Room', i, ':', rooms[i].name);
  }
}, errorCallback);
   */
    getRooms = function (callback, callbackError, params) {
        send(callback, callbackError, 'GET', undefined, 'rooms', params);
    };

/**
   * @function getRoom
   * @desc This function returns information on the specified room.
   * @memberOf N.API
   * @param {string} room Room ID
   * @param {function} callback(room) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
var roomID = '51c10d86909ad1f939000001';
N.API.getRoom(roomID, function(room) {
  console.log('Room name:', room.name);
}, errorCallback);
   */
    getRoom = function (room, callback, callbackError, params) {
        send(callback, callbackError, 'GET', undefined, 'rooms/' + room, params);
    };

/**
   * @function deleteRoom
   * @desc This function deletes the specified room.
   * @memberOf N.API
   * @param {string} room Room ID to be deleted
   * @param {function} callback(result) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
var room = '51c10d86909ad1f939000001';
N.API.deleteRoom(room, function(result) {
  console.log ('Result:' result);
}, errorCallback);
   */
    deleteRoom = function (room, callback, callbackError, params) {
        send(callback, callbackError, 'DELETE', undefined, 'rooms/' + room, params);
    };

/**
   * @function updateRoom
   * @desc This function updates a room.
   * @memberOf N.API
   * @param {string} roomId room ID.
   * @param {json} options Room configuration. See details about options in {@link N.API#createRoom createRoom(name, callback, callbackError, options)}.
   * @param {function} callback(room) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
N.API.updateRoom(XXXXXXXXXX, {
  publishLimit: -1,
  userLimit: -1,
  enableMixing: 1,
  mediaMixing: {
    video: {
      maxInput: 15,
      resolution: 'hd720p',
      multistreaming: 1,
      bitrate: 0,
      bkColor: {"r":1, "g":2, "b":255},
      layout: {
        base: 'lecture',
      },
      avCoordinated: 1
    },
    audio: null
  },
}, function (res) {
  console.log ('Room', res._id, 'updated');
}, function (err) {
  console.log ('Error:', err);
});
   */
    updateRoom = function (roomId, options, callback, callbackError, params) {
        send(callback, callbackError, 'PUT', (options || {}), 'rooms/' + roomId, params);
    };

/**
   * @function createToken
   * @desc This function creates a new token when a new participant to a room needs to be added.
   * @memberOf N.API
   * @param {string} room Room ID
   * @param {string} username Participant's name
   * @param {string} role Participant's role
   * @param {function} callback(token) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
var roomID = '51c10d86909ad1f939000001';
var name = 'john';
var role = 'guest';
N.API.createToken(roomID, name, role, function(token) {
  console.log ('Token created:' token);
}, errorCallback);
   */
    createToken = function (room, username, role, callback, callbackError, params) {
        send(callback, callbackError, 'POST', undefined, 'rooms/' + room + '/tokens', params, username, role);
    };

/**
   * @function createService
   * @desc This function creates a new service.
   * @memberOf N.API
   * @param {string} name Service name
   * @param {string} key Service key
   * @param {function} callback(service) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
var name = 'service1';
var key = '66510cd6989cd1f9565371';
N.API.createService(name, key, function(service) {
  console.log ('Service created:', service);
}, errorCallback);
   */
    createService = function (name, key, callback, callbackError, params) {
        send(callback, callbackError, 'POST', {name: name, key: key}, 'services/', params);
    };

/**
   * @function getServices
   * @desc This function lists the services in your server.
   * @memberOf N.API
   * @param {function} callback(services) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
N.API.getServices(function(services) {
  for(var i in services) {
    console.log('Service ', i, ':', services[i].name);
  }
}, errorCallback);
   */
    getServices = function (callback, callbackError, params) {
        send(callback, callbackError, 'GET', undefined, 'services/', params);
    };

/**
   * @function getService
   * @desc This function returns information on the specified service.
   * @memberOf N.API
   * @param {string} service service ID, service information
   * @param {function} callback(service) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
var service = '43243cda543efd5436789dd651';
N.API.getService(service, function(service) {
  console.log('Service name: ', service.name);
}, errorCallback);
   */
    getService = function (service, callback, callbackError, params) {
        send(callback, callbackError, 'GET', undefined, 'services/' + service, params);
    };

/**
   * @function deleteService
   * @desc This function deletes the specified service.
   * @memberOf N.API
   * @param {string} service service to be deleted
   * @param {function} callback(result) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
var service = '51c10d86909ad1f939000001';
N.API.deleteService(service, function(result) {
  console.log ('Result:' result);
}, errorCallback);
   */
    deleteService = function (service, callback, callbackError, params) {
        send(callback, callbackError, 'DELETE', undefined, 'services/' + service, params);
    };

/**
   * @function getUsers
   * @desc This function lists the users in a specified room.
   * @memberOf N.API
   * @param {string} room Room ID
   * @param {function} callback(users) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
var roomID = '51c10d86909ad1f939000001';
N.API.getUsers(roomID, function(users) {
  var userlist = JSON.parse(users);
  console.log ('This room has ', userslist.length, 'users');
  for (var i in userlist) {
    console.log('User ', i, ':', userlist[i].name, userlist[i].role);
  }
}, errorCallback);
   */
    getUsers = function (room, callback, callbackError, params) {
        send(callback, callbackError, 'GET', undefined, 'rooms/' + room + '/users/', params);
    };

/**
   * @function getUser
   * @desc This function gets a user's information from a specified room.
   * @memberOf N.API
   * @param {string} room Room ID
   * @param {string} user User's name
   * @param {function} callback(user) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
var roomID = '51c10d86909ad1f939000001';
var name = 'john';
N.API.getUser(roomID, name, function(user) {
  console.log('User:', name, 'Role:', user.role);
}, errorCallback);
   */
    getUser = function (room, user, callback, callbackError, params) {
        send(callback, callbackError, 'GET', undefined, 'rooms/' + room + '/users/' + user, params);
    };

/**
   * @function deleteUser
   * @desc This function deletes a user from a room.
   * @memberOf N.API
   * @param {string} room Room ID
   * @param {string} user User's name
   * @param {function} callback(result) Callback function on success
   * @param {function} callbackError(err) Callback function on error
   * @example
var roomID = '51c10d86909ad1f939000001';
var name = 'john';
N.API.deleteUser(roomID, name, function(res) {
  console.log('User', name, 'in room', roomID, 'deleted');
}, errorCallback);
   */
    deleteUser = function (room, user, callback, callbackError, params) {
        send(callback, callbackError, 'DELETE', undefined, 'rooms/' + room + '/users/' + user, params);
    };

    send = function (callback, callbackError, method, body, url, params, username, role) {
        var service, key, timestamp, cnounce, toSign, header, signed, req;

        if (params === undefined) {
            service = N.API.params.service;
            key = N.API.params.key;
            url = N.API.params.url + url;
        } else {
            service = params.service;
            key = params.key;
            url = params.url + url;
        }

        if (service === '' || key === '') {
            if (typeof callbackError === 'function')
                callbackError(401, 'ServiceID and Key are required!!');
            return;
        }

        timestamp = new Date().getTime();
        cnounce = require('crypto').randomBytes(8).toString('hex');

        toSign = timestamp + ',' + cnounce;

        header = 'MAuth realm=http://marte3.dit.upm.es,mauth_signature_method=HMAC_SHA256';

        if (username && role) {

            username = formatString(username);

            header += ',mauth_username=';
            header +=  username;
            header += ',mauth_role=';
            header +=  role;

            toSign += ',' + username + ',' + role;
        }

        signed = calculateSignature(toSign, key);

        header += ',mauth_serviceid=';
        header +=  service;
        header += ',mauth_cnonce=';
        header += cnounce;
        header += ',mauth_timestamp=';
        header +=  timestamp;
        header += ',mauth_signature=';
        header +=  signed;

        req = new XMLHttpRequest({rejectUnauthorized: N.API.params.rejectUnauthorizedCert});

        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                switch (req.status) {
                case 100:
                case 200:
                case 201:
                case 202:
                case 203:
                case 204:
                case 205:
                    if (typeof callback === 'function') callback(req.responseText);
                    break;
                default:
                    if (typeof callbackError === 'function') callbackError(req.status, req.responseText);
                }
            }
        };

        req.open(method, url, true);

        req.setRequestHeader('Authorization', header);

        if (body !== undefined) {
            req.setRequestHeader('Content-Type', 'application/json');
            req.send(JSON.stringify(body));
        } else {
            req.send();
        }
    };

    calculateSignature = function (toSign, key) {
        var hash, hex, signed;
        hash = CryptoJS.HmacSHA256(toSign, key);
        hex = hash.toString(CryptoJS.enc.Hex);
        signed = N.Base64.encodeBase64(hex);
        return signed;
    };

    function formatString (s) {
        return (new Buffer(s, 'utf8')).toString('base64');
    }

    return {
        params: params,
        rejectUnauthorizedCert: rejectUnauthorizedCert,
        init: init,
        createRoom: createRoom,
        getRooms: getRooms,
        getRoom: getRoom,
        deleteRoom: deleteRoom,
        updateRoom: updateRoom,
        createToken: createToken,
        createService: createService,
        getServices: getServices,
        getService: getService,
        deleteService: deleteService,
        getUsers: getUsers,
        getUser: getUser,
        deleteUser: deleteUser
    };
}(N));