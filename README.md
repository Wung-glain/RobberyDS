# Robbery Detection System Dashboard: Real-Time Human Tracking & Analytics
A high-performance surveillance dashboard that performs real-time human detection and tracking. This project uses YOLOv8 for computer vision, FastAPI for high-speed WebSocket streaming, and React for a responsive monitoring interface.

## Key Features
- Real-time Detection: Powered by YOLOv8 for industry-leading accuracy.

- Persistent Tracking: Custom centroid tracking to follow individuals across frames.

- Suspicion Scoring: Dynamic algorithm that increases a "suspicion score" based on a person's duration and movement in the frame.

- Optimized Performance: Uses frame-skipping and image resizing (320px) to ensure smooth 30+ FPS playback.

- Live WebSockets: Low-latency communication between the AI backend and the frontend.

## Tech Stack
- Frontend: React, Tailwind CSS, Lucide Icons

- Backend: Python, FastAPI, WebSockets

- AI Engine: Ultralytics YOLOv8, OpenCV

- Environment: Python Virtual Environment (venv)

## Getting Started
Follow these steps to set up the project on your local machine using a virtual environment.

1. Clone the Repository
```

git clone https://github.com/Wung-glain/RobberyDS.git
cd your-repo-name
```
2. Backend Setup (Python)
We use a virtual environment to keep dependencies isolated and stable.
Bash

## Navigate to backend folder
```
cd backend
```
## Create the virtual environment
```
python -m venv myenv
```

## Activate the environment
### On Windows:
```
myenv\Scripts\activate
```
### On Mac/Linux:
```
source myenv/bin/activate
```

### Install required packages
```
pip install fastapi uvicorn ultralytics opencv-python numpy
```
3. Frontend Setup (React)
Open a new terminal window:
```

cd frontend
npm install
npm start
```
## Running the Application
Start the Backend: Ensure your virtual environment is active and run:

```

python main.py
```
The server will start at http://localhost:8000

View the Dashboard: Your React app should be running at http://localhost:8080. The video stream will automatically connect via WebSocket.
## Dashboard UI

![React application Dashboard showing user interface](public/screenshots/RBS.png)

## Project Structure
```

├── backend/
│   ├── myenv/             # Virtual Environment
│   ├── videos/            # CCTV source files
│   ├── main.py            # FastAPI WebSocket & AI Logic
│   └── yolov8n.pt         # Pre-trained YOLO weights
├── frontend/
│   ├── src/
│   │   ├── components/    # VideoCanvas & Dashboard UI
│   │   └── App.js         # Application entry point
│   └── package.json
└── README.md
```
## License
This project is licensed under the MIT License - see the LICENSE file for details.
