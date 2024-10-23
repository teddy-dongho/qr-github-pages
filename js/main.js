/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

"use strict";

const videoElement = document.querySelector("video");
const videoSelect = document.querySelector("select#videoSource");
const selectors = [videoSelect];

function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
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
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    } else {
      console.log("Some other kind of source/device: ", deviceInfo);
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

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  videoElement.srcObject = stream;
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log(
    "navigator.MediaDevices.getUserMedia error: ",
    error.message,
    error.name
  );
}

let videoSource;
function start() {
  if (window.stream) {
    window.stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  videoSource = videoSelect.value;
  const constraints = {
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .then(gotDevices)
    .catch(handleError);
};

videoSelect.onchange = start;

start();

function onQRCodeScanned(scannedText) {
  var scannedTextMemo = document.getElementById("scannedTextMemo");
  if (scannedTextMemo) {
    scannedTextMemo.value = scannedText;
  }
}

//funtion returning a promise with a video stream
function provideVideoQQ() {
  return navigator.mediaDevices.getUserMedia({
    video: {
      optional: [
        {
          sourceId: videoSource ? { exact: videoSource } : undefined,
        },
      ],
    },
  });
}

//this function will be called when JsQRScanner is ready to use
function JsQRScannerReady() {
  //create a new scanner passing to it a callback function that will be invoked when
  //the scanner succesfully scan a QR code
  var jbScanner = new JsQRScanner(onQRCodeScanned, provideVideoQQ);
  //reduce the size of analyzed images to increase performance on mobile devices
  jbScanner.setSnapImageMaxSize(300);
  var scannerParentElement = document.getElementById("scanner");
  if (scannerParentElement) {
    //append the jbScanner to an existing DOM element
    jbScanner.appendTo(scannerParentElement);
  }
}
