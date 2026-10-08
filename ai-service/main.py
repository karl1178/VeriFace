from fastapi import FastAPI, UploadFile, File, HTTPException
import face_recognition
import numpy as np
import cv2

app = FastAPI()

@app.post("/extract-feature")
async def extract_face(image: UploadFile = File(...)):
    # 1. Baca gambar yang diunggah dari stream
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    # Pastikan gambar berhasil didekode
    if img is None:
        raise HTTPException(status_code=400, detail="File gambar tidak valid atau rusak.")

    # 2. Tangani jika gambar memiliki 4 channel (RGBA) atau 1 channel (Grayscale)
    if len(img.shape) == 2:
        # Grayscale -> ubah ke RGB 3 channel
        rgb_img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 4:
        # RGBA -> ubah ke RGB
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGRA2RGB)
    else:
        # Standar BGR -> RGB
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # 3. Paksa tipe data uint8 dan buat contiguous array secara eksplisit untuk dlib
    rgb_img = np.ascontiguousarray(rgb_img, dtype=np.uint8)

    # Coba deteksi ulang dengan upsampling lebih tinggi jika wajah kecil di frame.
    face_locations = face_recognition.face_locations(rgb_img, number_of_times_to_upsample=1)
    if not face_locations:
        face_locations = face_recognition.face_locations(rgb_img, number_of_times_to_upsample=2)

    # 4. Cari wajah dan ekstrak fiturnya
    encodings = face_recognition.face_encodings(rgb_img, known_face_locations=face_locations)

    if len(encodings) > 0:
        return {
            "status": "success", 
            "feature": encodings[0].tolist()
        }
    else:
        return {
            "status": "error", 
            "message": "Wajah tidak ditemukan di foto"
        }