from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
import face_recognition
import numpy as np
import cv2
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}


def decode_image(contents: bytes) -> np.ndarray:
    image = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_UNCHANGED)
    if image is None:
        raise HTTPException(status_code=400, detail="File gambar tidak valid atau rusak.")

    if len(image.shape) == 2:
        return cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    if image.shape[2] == 4:
        return cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def find_face_encodings(image: np.ndarray) -> list:
    image = np.ascontiguousarray(image, dtype=np.uint8)
    locations = face_recognition.face_locations(image, number_of_times_to_upsample=1)
    if not locations:
        locations = face_recognition.face_locations(image, number_of_times_to_upsample=2)
    return face_recognition.face_encodings(image, known_face_locations=locations)


@app.post("/extract-feature")
async def extract_face(image: UploadFile = File(...)):
    contents = await image.read()
    encodings = find_face_encodings(decode_image(contents))

    if encodings:
        return {
            "status": "success",
            "feature": encodings[0].tolist(),
        }
    return {
        "status": "error",
        "message": "Wajah tidak ditemukan di foto",
    }