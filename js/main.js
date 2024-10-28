"use strict";

const videoElement = document.querySelector("video");
const videoSelect = document.getElementById("videoSource");
const toggleTorchButton = document.getElementById("toggle-torch");
const selectors = [videoSelect];

// 가져온 장치 목록을 업데이트하는 함수
function gotDevices(deviceInfos) {
  const values = selectors.map((select) => select.value);
  selectors.forEach((select) => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (
      Array.prototype.slice
        .call(select.childNodes)
        .some((n) => n.value === values[selectorIndex])
    ) {
      select.value = values[selectorIndex];
    }
  });
}


function getDevices() {
  return navigator.mediaDevices.enumerateDevices().then(devices => {
    window.devices = devices;
    console.log('devices', devices);
    return devices;
  });
}

// 카메라 스트림 설정
function gotStream(stream) {
  videoElement.srcObject = stream; // 비디오 요소에 스트림 할당
  return getDevices();
}

function getUserMedia(source) {
  return navigator.mediaDevices.getUserMedia(getConstrains(source)).then((mediaStream) => {
    console.log('mediaStream', mediaStream);
    window.stream = mediaStream;
    return mediaStream;
  })
}

async function applyTorch() {
  const track = window.stream.getVideoTracks()[0];
  addLogMessage("track settings: " + JSON.stringify(track.getSettings()));
  const capabilities = track.getCapabilities();
  console.log("capabilities.torch", capabilities.torch);
  addLogMessage("capabilities: " + JSON.stringify(capabilities));
  // if (capabilities.torch) {
  //   toggleTorchButton.addEventListener("click", () => {
  //     try {
  //       if (track) {
  //         addLogMessage('toggle');
  //         const torchState = track.getSettings().torch || false;
  //         track.applyConstraints({
  //           advanced: [{ torch: !torchState }],
  //         });
  //       } else {
  //         addLogMessage('track에 torch가 없습니다');
  //         alert("track에 torch가 없습니다");
  //       }
  //     } catch (e) {
  //       addLogMessage(e);
  //     }
  //   });
  // } else {
  //   console.log("This device does not support torch functionality.");
  //   try {
  //     toggleTorchButton.addEventListener("click", () => {
  //       addLogMessage("torch가 지원되지 않습니다");
  //       alert("torch가 지원되지 않습니다");
  //     });
  //   } catch (e) {
  //     addLogMessage(e);
  //   }
  // }
}

// 오류 처리 함수
function handleError(error) {
  console.error(
    "navigator.MediaDevices.getUserMedia error: ",
    error.message,
    error.name
  );
}

function getConstrains(source) {
  const videoSource = source || videoSelect.value;
  const constraints = {
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  return constraints
}

// 카메라 선택 후 스트림 시작
function start(source) {
  stopStream();
  return getUserMedia(source)
    .then(gotStream)
    .then(gotDevices)
    .then(applyTorch)
    .catch(handleError);
}

// 비디오 장치 선택 변경 시 호출
videoSelect.onchange = () => start();

function stopStream() {
  if (window.stream) {
    window.stream.getTracks().forEach((track) => track.stop());
  }
}

// Get the available video input devices (cameras)
function getCameras() {
  return getDevices()
    .then(function (devices) {
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      console.log('videoDevices', videoDevices);

      videoDevices.forEach((device) => {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.text = device.label || `Camera ${videoSelect.length + 1}`;
        videoSelect.appendChild(option);
      });

      addLogMessage(JSON.stringify(videoSelect.options));
      const backCamera = Array.from(videoSelect.options).find((option) =>
        option.text.toLowerCase().includes("back") || option.text.toLowerCase().includes("후면")
      );
      if (backCamera) {
        videoSelect.value = backCamera.value;
      }
      
      try {
        return setCameraStream(backCamera.value);
      } catch (e) {
        return setCameraStream();
      }
    })
    .catch(function (err) {
      console.error("Error enumerating devices:", err);
    });
}

// Set the video stream from the selected camera
function setCameraStream(source) {
  console.log('setCameraStream', source);
  stopStream();
  return getUserMedia(source)
    .then(function (mediaStream) {
      video.srcObject = mediaStream;
    })
    .catch(function (err) {
      console.error("Error accessing the camera:", err);
    });
}

// // Event listener for camera selection change
// videoSelect.addEventListener("change", function () {
//   setCameraStream(videoSelect.value);
// });

// Start the camera selection process
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

getCameras().then(start).then(() => delay(500)).then(() => {
  const backCamera = Array.from(videoSelect.options).find((option) =>
    option.text.toLowerCase().includes("back") || option.text.toLowerCase().includes("후면 카메라")
  );
  if (backCamera) {
    videoSelect.value = backCamera.value;
    addLogMessage("backCamera: " + backCamera.value);
  }
}).then(start);

function addLogMessage(message) {
  const logContainer = document.getElementById("logContainer");
  
  // 새로운 로그 메시지 요소 생성
  const logMessage = document.createElement("p");
  logMessage.textContent = message;

  // logContainer에 로그 메시지를 추가
  logContainer.appendChild(logMessage);
  
  // 자동 스크롤
  logContainer.scrollTop = logContainer.scrollHeight;
}
