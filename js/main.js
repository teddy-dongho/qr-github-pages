"use strict";

const videoElement = document.querySelector("video");
const videoSelect = document.getElementById('videoSource');
const toggleTorchButton = document.getElementById('toggle-torch');
const selectors = [videoSelect];
let stream;

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

// 카메라 스트림 설정
function gotStream(stream) {
  window.stream = stream; // 스트림을 전역에서 사용할 수 있도록 설정
  videoElement.srcObject = stream; // 비디오 요소에 스트림 할당
  const track = stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  return navigator.mediaDevices.enumerateDevices();
}

// 카메라 플래시 설정
function gotStream(stream) {
  window.stream = stream; // 스트림을 전역에서 사용할 수 있도록 설정
  videoElement.srcObject = stream; // 비디오 요소에 스트림 할당
  return navigator.mediaDevices.enumerateDevices();
}

async function applyTorch() {
  const track = window.stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  const capabilities = await imageCapture.getPhotoCapabilities();
  console.log('capabilities.torch', capabilities.torch);
  if (capabilities.torch) {
      toggleTorchButton.style.display = 'block';
      toggleTorchButton.addEventListener('click', () => {
        if (track) {
            const torchState = track.getSettings().torch || false;
            track.applyConstraints({
                advanced: [{ torch: !torchState }]
            });
        }
    });
  } else {
      console.log("This device does not support torch functionality.");
  }
}

// 오류 처리 함수
function handleError(error) {
  console.error("navigator.MediaDevices.getUserMedia error: ", error.message, error.name);
}

// 카메라 선택 후 스트림 시작
function start() {
  if (window.stream) {
    window.stream.getTracks().forEach((track) => track.stop());
  }
  const videoSource = videoSelect.value;
  const constraints = {
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .then(gotDevices)
    .then(applyTorch)
    .catch(handleError);
}

// 비디오 장치 선택 변경 시 호출
videoSelect.onchange = start;

// 장치 목록 가져오기
navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

// QR 코드 스캔 시 호출되는 함수
function onQRCodeScanned(scannedText) {
  const scannedTextMemo = document.getElementById("scannedTextMemo");
  if (scannedTextMemo) {
    scannedTextMemo.value = scannedText;
  }
}

// 비디오 스트림을 제공하는 함수
function provideVideoQQ() {
  const videoSource = videoSelect.value;
  return navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: videoSource ? { exact: videoSource } : undefined,
    },
  });
}

// JsQRScanner 초기화 함수
function JsQRScannerReady() {
  const jbScanner = new JsQRScanner(onQRCodeScanned, provideVideoQQ);
  jbScanner.setSnapImageMaxSize(300);
  const scannerParentElement = document.getElementById("scanner");
  if (scannerParentElement) {
    jbScanner.appendTo(scannerParentElement);
  }
}

function stopStream() {
  if (stream) {
      stream.getTracks().forEach(track => track.stop());
  }
}

// Get the available video input devices (cameras)
function getCameras() {
  navigator.mediaDevices.enumerateDevices()
      .then(function(devices) {
          const videoDevices = devices.filter(device => device.kind === 'videoinput');

          videoDevices.forEach(device => {
              const option = document.createElement('option');
              option.value = device.deviceId;
              option.text = device.label || `Camera ${videoSelect.length + 1}`;
              videoSelect.appendChild(option);
          });

          // Try to select a camera with "back" in the label, otherwise select the first one
          const backCamera = Array.from(videoSelect.options).find(option => option.text.toLowerCase().includes('back'));
          if (backCamera) {
              videoSelect.value = backCamera.value;
          }

          setCameraStream(videoSelect.value); // Set initial camera
      })
      .catch(function(err) {
          console.error('Error enumerating devices:', err);
      });
}

// Set the video stream from the selected camera
function setCameraStream(deviceId) {
  stopStream(); // Stop previous stream if any

  const constraints = {
      video: {
          deviceId: { exact: deviceId }
      }
  };

  navigator.mediaDevices.getUserMedia(constraints)
      .then(function(mediaStream) {
          stream = mediaStream;
          video.srcObject = stream;
      })
      .catch(function(err) {
          console.error('Error accessing the camera:', err);
      });
}

// Event listener for camera selection change
videoSelect.addEventListener('change', function() {
  setCameraStream(videoSelect.value);
});

// Start the camera selection process
getCameras();

// 페이지가 로드되면 초기 스트림 설정 시작
start();