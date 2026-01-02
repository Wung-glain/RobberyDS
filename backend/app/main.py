import cv2
import asyncio
import base64
import os
import numpy as np
from fastapi import FastAPI, WebSocket
from ultralytics import YOLO

app = FastAPI()

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__)).replace('\\', '/')
VIDEO_PATH = os.path.join(BASE_DIR, "videos", "cctv.mp4").replace('\\', '/')

# Load Model
print("Loading AI Model...")
model = YOLO("yolov8n.pt")

# --- MANUAL TRACKER LOGIC (Verified Stable) ---
class SimpleTracker:
    def __init__(self):
        self.center_points = {}
        self.id_count = 0
        self.scores = {} # Track suspicion scores per ID

    def update(self, rects):
        objects_bbs_ids = []
        for rect in rects:
            x, y, w, h = rect
            cx = (x + x + w) // 2
            cy = (y + y + h) // 2

            same_object_detected = False
            for id, pt in self.center_points.items():
                dist = np.hypot(cx - pt[0], cy - pt[1])
                if dist < 45: # Sensitivity of the follow
                    self.center_points[id] = (cx, cy)
                    # Increase suspicion score slowly (0.2 per frame)
                    self.scores[id] = round(min(100, self.scores.get(id, 10.0) + 0.2), 1)
                    
                    objects_bbs_ids.append({
                        "box": [x, y, x + w, y + h],
                        "id": id,
                        "score": self.scores[id]
                    })
                    same_object_detected = True
                    break

            if not same_object_detected:
                self.center_points[self.id_count] = (cx, cy)
                self.scores[self.id_count] = 10.0
                objects_bbs_ids.append({
                    "box": [x, y, x + w, y + h],
                    "id": self.id_count,
                    "score": 10.0
                })
                self.id_count += 1
        return objects_bbs_ids

tracker = SimpleTracker()

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🚀 WebSocket Connected & Tracking Active")
    
    # Check if video file exists, otherwise use webcam
    source = VIDEO_PATH if os.path.exists(VIDEO_PATH) else 0
    cap = cv2.VideoCapture(source)
    
    try:
        while True:
            success, frame = cap.read()
            if not success:
                if source != 0:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                break

            # 1. AI Detection
            results = model(frame, stream=True, classes=[0], conf=0.4, verbose=False)
            
            raw_rects = []
            for r in results:
                boxes = r.boxes.xywh.cpu().numpy()
                for box in boxes:
                    x, y, w, h = box
                    raw_rects.append([int(x - w/2), int(y - h/2), int(w), int(h)])

            # 2. Manual Tracking
            detections = tracker.update(raw_rects)

            # 3. Base64 Encoding
            _, buffer = cv2.imencode('.jpg', frame)
            img_str = base64.b64encode(buffer).decode('utf-8')

            # 4. Send to Frontend
            await websocket.send_json({
                "image": img_str,
                "detections": detections
            })
            
            # Sync to ~30 FPS
            await asyncio.sleep(0.03)

    except Exception as e:
        print(f"❌ WebSocket Error: {e}")
    finally:
        cap.release()
        print("🔒 Connection Closed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)