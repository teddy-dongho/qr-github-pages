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
  return new Promise((resolve, reject) => {
    if (window.devices != undefined) {
      console.log('window.devices', window.devices);
      resolve(window.devices);
    } else {
      return navigator.mediaDevices.enumerateDevices().then(devices => {
        window.devices = devices;
        console.log('devices', devices);
        resolve(devices);
      }).catch(e => reject(e));
    }
  });
}

// 카메라 스트림 설정
function gotStream(stream) {
  videoElement.srcObject = stream; // 비디오 요소에 스트림 할당
  return getDevices();
}

function getUserMedia() {
  return new Promise((resolve, reject) => {
    if (window.stream != undefined) {
      console.log('window.stream', window.stream);
      resolve(window.stream);
    } else {
      return navigator.mediaDevices.getUserMedia(getConstrains()).then((mediaStream) => {
        console.log('mediaStream', mediaStream);
        window.stream = mediaStream;
        resolve(mediaStream);
      }).catch(e => reject(e));
    }
  });
}

async function applyTorch() {
  const track = window.stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  const capabilities = await imageCapture.getPhotoCapabilities();
  console.log("capabilities.torch", capabilities.torch);
  if (capabilities.torch) {
    toggleTorchButton.addEventListener("click", () => {
      if (track) {
        const torchState = track.getSettings().torch || false;
        track.applyConstraints({
          advanced: [{ torch: !torchState }],
        });
      } else {
        alert("track에 torch가 없습니다");
      }
    });
  } else {
    console.log("This device does not support torch functionality.");
    toggleTorchButton.addEventListener("click", () => {
      alert("torch가 지원되지 않습니다");
    });
  }
}

// 오류 처리 함수
function handleError(error) {
  console.error(
    "navigator.MediaDevices.getUserMedia error: ",
    error.message,
    error.name
  );
}

function getConstrains() {
  const backCamera = Array.from(videoSelect.options).find((option) =>
    option.text.toLowerCase().includes("back") || option.text.toLowerCase().includes("후면")
  );
  if (backCamera) {
    videoSelect.value = backCamera.value;
  }
  const videoSource = videoSelect.value;
  const constraints = {
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  return constraints
}

// 카메라 선택 후 스트림 시작
function start() {
  stopStream();
  return getUserMedia()
    .then(gotStream)
    .then(gotDevices)
    .then(applyTorch)
    .catch(handleError);
}

// 비디오 장치 선택 변경 시 호출
videoSelect.onchange = start;

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

      setCameraStream();
    })
    .catch(function (err) {
      console.error("Error enumerating devices:", err);
    });
}

// Set the video stream from the selected camera
function setCameraStream() {
  stopStream(); // Stop previous stream if any
  getUserMedia()
    .then(function (mediaStream) {
      video.srcObject = mediaStream;
    })
    .catch(function (err) {
      console.error("Error accessing the camera:", err);
    });
}

// Event listener for camera selection change
videoSelect.addEventListener("change", function () {
  setCameraStream(videoSelect.value);
});

// Start the camera selection process
getCameras().then(start);
