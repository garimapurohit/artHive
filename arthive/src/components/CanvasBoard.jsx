import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // replace with deployed backend URL

function CanvasBoard() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [roomId, setRoomId] = useState("default");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    socket.emit("join-room", roomId);

    socket.on("draw", ({ x0, y0, x1, y1, color, size }) => {
      drawLine(x0, y0, x1, y1, color, size, ctx);
    });

    socket.on("clear-board", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("draw");
      socket.off("clear-board");
    };
  }, [roomId]);

  const drawLine = (x0, y0, x1, y1, color, size, ctx, emit = false) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.closePath();

    if (emit) {
      socket.emit("draw", { x0, y0, x1, y1, color, size, roomId });
    }
  };

  const handleMouseDown = (e) => {
    setDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    canvasRef.current.prevX = offsetX;
    canvasRef.current.prevY = offsetY;
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext("2d");
    const { prevX, prevY } = canvasRef.current;
    drawLine(prevX, prevY, offsetX, offsetY, color, brushSize, ctx, true);
    canvasRef.current.prevX = offsetX;
    canvasRef.current.prevY = offsetY;
  };

  const handleMouseUp = () => setDrawing(false);

  const handleClear = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket.emit("clear-board", roomId);
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <div className="absolute top-4 left-4 z-10 bg-white shadow p-2 rounded flex gap-2">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
        <input type="text" placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="border p-1" />
        <button onClick={handleClear} className="bg-red-500 text-white px-2 py-1 rounded">Clear</button>
      </div>
    </div>
  );
}

export default CanvasBoard;