from fastapi import FastAPI, UploadFile, File
import face_recognition
import numpy as np
import cv2

app = FastAPI()

@app.post("/extract-feature")
async def extract_face(image: UploadFile = File(...)):
    # 1. Baca gambar yang diunggah
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 2. Konversi BGR (OpenCV) ke RGB (face_recognition)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # 3. Cari wajah dan ekstrak fiturnya (128 angka matriks)
    encodings = face_recognition.face_encodings(rgb_img)

    if len(encodings) > 0:
        # Kembalikan vektor wajah pertama yang terdeteksi
        return {
            "status": "success", 
            "feature": encodings[0].tolist() # Ubah ke list agar bisa dibaca JSON/Database
        }
    else:
        return {
            "status": "error", 
            "message": "Wajah tidak ditemukan di foto"
        }