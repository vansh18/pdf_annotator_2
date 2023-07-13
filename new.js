let pdfDoc = null;
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let pageNum = 1;
let scale = 1.0;
let pageRendering = false;
let pageNumPending = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

const pdfjsLib = window["pdfjs-dist/build/pdf"];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://mozilla.github.io/pdf.js/build/pdf.worker.js";

// Function to render the PDF page on the canvas
function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(function (page) {
    let viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    let renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    let renderTask = page.render(renderContext);

    renderTask.promise.then(function () {
      pageRendering = false;

      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });
}

// Function to load and display the PDF
function loadPDF(url) {
  pdfjsLib.getDocument(url).promise.then(function (pdfDoc_) {
    pdfDoc = pdfDoc_;
    renderPage(pageNum);
  });
}

// Load the PDF file
loadPDF("test.pdf");

// Function to handle drawing on the canvas
function handleDrawing(e) {
  if (!isDrawingEnabled) return;
  ctx.strokeStyle = drawingColor;
  ctx.lineWidth = drawingThickness;
  if ((e.type === "mousedown" || e.type === "touchstart") && isDrawingEnabled) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
  } else if (
    (e.type === "mousemove" || e.type === "touchmove") &&
    isDrawingEnabled
  ) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
  } else if (
    (e.type === "mouseup" || e.type === "touchend") &&
    isDrawingEnabled
  ) {
    isDrawing = false;
  }
}

// Removing duplicate event listeners
canvas.removeEventListener("mousedown", handleDrawing);
canvas.removeEventListener("mousemove", handleDrawing);
canvas.removeEventListener("mouseup", handleDrawing);
canvas.removeEventListener("mouseout", handleDrawing);
canvas.removeEventListener("touchstart", handleDrawing);
canvas.removeEventListener("touchmove", handleDrawing);
canvas.removeEventListener("touchend", handleDrawing);

// Adding updated event listeners
canvas.addEventListener("mousedown", handleDrawing);
canvas.addEventListener("mousemove", handleDrawing);
canvas.addEventListener("mouseup", handleDrawing);
canvas.addEventListener("mouseout", handleDrawing);
canvas.addEventListener("touchstart", handleDrawing);
canvas.addEventListener("touchmove", handleDrawing);
canvas.addEventListener("touchend", handleDrawing);

// Function to handle saving modifications
// ----------- Not working as of now -----------
document.getElementById("save-button").addEventListener("click", function () {
  if (!pdfDoc) return;

  let pdfData = canvas.toDataURL("image/jpeg");

  pdfDoc.getPage(pageNum).then(function (page) {
    page.addImage(pdfData, "JPEG", 0, 0, page.getWidth(), page.getHeight());
    pdfDoc.save();
  });
});

// Function to handle zooming in
document.getElementById("zoom-in").addEventListener("click", function () {
  scale += 0.1; // Increase scale by 0.1
  renderPage(pageNum);
  updateZoomPercentage();
});

// Function to handle zooming out
document.getElementById("zoom-out").addEventListener("click", function () {
  if (scale <= 0.2) return; // Minimum scale limit to prevent excessive zooming out
  scale -= 0.1; // Decrease scale by 0.1
  renderPage(pageNum);
  updateZoomPercentage();
});

// Function to update the zoom percentage display
function updateZoomPercentage() {
  let zoomPercentage = Math.round(scale * 100);
  document.getElementById("zoom-percentage").textContent = zoomPercentage + "%";
}

// Function to navigate to the next page
function nextPage() {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  renderPage(pageNum);
  updateZoomPercentage();
}

// Function to navigate to the previous page
function prevPage() {
  if (pageNum <= 1) return;
  pageNum--;
  renderPage(pageNum);
  updateZoomPercentage();
}

// Function to handle next button click
document.getElementById("next-button").addEventListener("click", nextPage);

// Function to handle previous button click
document.getElementById("prev-button").addEventListener("click", prevPage);

let isDrawingEnabled = false;
let drawingColor = "#000000";
let drawingThickness = 2;

// Function to toggle drawing
function toggleDrawing() {
  isDrawingEnabled = !isDrawingEnabled;
  if (isDrawingEnabled) {
    canvas.style.cursor = "crosshair";
    canvas.addEventListener("mousedown", handleDrawing);
    canvas.addEventListener("mousemove", handleDrawing);
    canvas.addEventListener("mouseup", handleDrawing);
    canvas.addEventListener("mouseout", handleDrawing);
    canvas.addEventListener("touchstart", handleDrawing);
    canvas.addEventListener("touchmove", handleDrawing);
    canvas.addEventListener("touchend", handleDrawing);
    document.getElementById("toggle-drawing").textContent = "Stop Drawing";
  } else {
    canvas.style.cursor = "auto";
    canvas.removeEventListener("mousedown", handleDrawing);
    canvas.removeEventListener("mousemove", handleDrawing);
    canvas.removeEventListener("mouseup", handleDrawing);
    canvas.removeEventListener("mouseout", handleDrawing);
    canvas.removeEventListener("touchstart", handleDrawing);
    canvas.removeEventListener("touchmove", handleDrawing);
    canvas.removeEventListener("touchend", handleDrawing);
    document.getElementById("toggle-drawing").textContent = "Start Drawing";
  }
}

// Function to handle drawing on the canvas
function handleDrawing(e) {
  if (!isDrawingEnabled) return;
  ctx.strokeStyle = drawingColor;
  ctx.lineWidth = drawingThickness;
  if (e.type === "mousedown" || e.type === "touchstart") {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
  } else if (e.type === "mousemove" || e.type === "touchmove") {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
  } else if (e.type === "mouseup" || e.type === "touchend") {
    isDrawing = false;
  }
}

// Function to handle color change
function handleColorChange(e) {
  drawingColor = e.target.value;
}

// Function to handle thickness change
function handleThicknessChange(e) {
  drawingThickness = parseInt(e.target.value);
}

// Function to handle clearing the user drawings on the canvas
function clearCanvas() {
  // Clear the user drawings
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw the PDF page
  renderPage(pageNum);
}

// Event listener for the "Clear" button
document.getElementById("clear-button").addEventListener("click", clearCanvas);

// Event listeners
canvas.addEventListener("mousedown", handleDrawing);
canvas.addEventListener("mousemove", handleDrawing);
canvas.addEventListener("mouseup", handleDrawing);
canvas.addEventListener("mouseout", handleDrawing);

canvas.addEventListener("touchstart", handleDrawing);
canvas.addEventListener("touchmove", handleDrawing);
canvas.addEventListener("touchend", handleDrawing);

document
  .getElementById("toggle-drawing")
  .addEventListener("click", toggleDrawing);
document
  .getElementById("drawing-color")
  .addEventListener("change", handleColorChange);
document
  .getElementById("drawing-thickness")
  .addEventListener("input", handleThicknessChange);
