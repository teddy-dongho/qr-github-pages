"use strict";

const videoElement = document.querySelector("video");
const videoSelect = document.getElementById("videoSource");
const toggleTorchButton = document.getElementById("toggle-torch");
let stream;

// 카메라 장치 목록을 업데이트하는 함수
function gotDevices(deviceInfos) {
  videoSelect.innerHTML = ''; // 초기화
  for (const deviceInfo of deviceInfos) {
    if (deviceInfo.kind === "videoinput") {
      const option = document.createElement("option");
      option.value = deviceInfo.deviceId;
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
}

// 카메라 스트림을 가져오고 플래시 제어 설정
async function start() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop()); // 이전 스트림 중지
  }
  const videoSource = videoSelect.value;
  const constraints = {
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    await applyTorch(stream); // 플래시 제어 설정 호출
    const devices = await navigator.mediaDevices.enumerateDevices();
    gotDevices(devices);
  } catch (error) {
    console.error("Error accessing camera: ", error);
  }
}

// 플래시(토치) 설정 함수
async function applyTorch(stream) {
  const track = stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  const capabilities = await imageCapture.getPhotoCapabilities();

  if (capabilities.torch) {
    toggleTorchButton.disabled = false;
    toggleTorchButton.addEventListener("click", () => {
      const torchState = track.getSettings().torch || false;
      track
        .applyConstraints({ advanced: [{ torch: !torchState }] })
        .catch((error) => console.error("Torch toggle failed:", error));
    });
  } else {
    console.log("This device does not support torch functionality.");
    toggleTorchButton.disabled = true;
    toggleTorchButton.addEventListener("click", () => {
      alert("Torch is not supported on this device.");
    });
  }
}

// 장치 목록 가져오기
navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(console.error);

// 비디오 장치 선택 변경 시 호출
videoSelect.onchange = start;

// 초기 카메라 스트림 시작
start();