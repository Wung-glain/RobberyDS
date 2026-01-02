import cv2
import asyncio
import base64
import os
from fastapi import FastAPI, WebSocket
from ultralytics import YOLO

app = FastAPI()

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__)).replace('\\', '/')
VIDEO_PATH = os.path.join(BASE_DIR, "videos", "cctv.mp4").replace('\\', '/')

# Track scores globally per track_id: {id: score}
tracker_scores = {}

# Global model loading
try:
    print("Loading AI Model...")
    model = YOLO("yolov8n.pt")
except Exception as e:
    print(f"Model Error: {e}")

def get_video_source(path):
    if os.path.exists(path):
        print(f"✅ Video file found at: {path}")
        return path
    else:
        print(f"⚠️ Video file NOT found. Falling back to WEBCAM (0)")
        return 0

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🚀 Frontend connection established")
    
    source = get_video_source(VIDEO_PATH)
    cap = cv2.VideoCapture(source)
    
    if not cap.isOpened():
        print("❌ CRITICAL: Could not open any video source.")
        await websocket.close()
        return

    try:
        while True:
            success, frame = cap.read()
            
            if not success:
                if isinstance(source, str):
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    # Clear scores on video loop to prevent memory bloat
                    tracker_scores.clear()
                    continue
                else:
                    break

            # AI Inference with Tracking (Assigns unique IDs to people)
            results = model.track(frame, persist=True, verbose=False, classes=[0])[0] 
            
            detections = []
            
            # Check if boxes and track IDs exist
            if results.boxes and results.boxes.id is not None:
                boxes = results.boxes.xyxy.cpu().numpy().astype(int)
                ids = results.boxes.id.cpu().numpy().astype(int)
                confs = results.boxes.conf.cpu().numpy()

                for box, track_id, conf in zip(boxes, ids, confs):
                    # Logic: Increase suspicion the longer the person is in the frame
                    if track_id not in tracker_scores:
                        tracker_scores[track_id] = 10.0 # Initial suspicion
                    else:
                        # Increment suspicion by 0.2% every frame (~6% per second)
                        tracker_scores[track_id] = min(100.0, tracker_scores[track_id] + 0.2)

                    detections.append({
                        "box": box.tolist(), # [x1, y1, x2, y2]
                        "id": int(track_id),
                        "score": round(tracker_scores[track_id], 1),
                        "label": f"Suspect #{track_id}"
                    })

            # Encoding frame to base64
            _, buffer = cv2.imencode('.jpg', frame)
            img_str = base64.b64encode(buffer).decode('utf-8')

            # Send to React
            await websocket.send_json({
                "image": img_str,
                "detections": detections
            })
            
            await asyncio.sleep(0.03)

    except Exception as e:
        print(f"❌ STREAM ERROR: {e}")
    finally:
        cap.release()
        tracker_scores.clear()
        print("🔒 Stream released")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)