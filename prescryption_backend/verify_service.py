from flask import Flask, request, jsonify
import json
import logging

app = Flask(__name__)

# ✅ Configurar logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# ✅ Cargar datos desde un archivo JSON
try:
    with open('professionals_data.json', 'r') as f:
        data = json.load(f)
        VALID_DOCTORS = data.get('doctors', {})
        VALID_PHARMACISTS = data.get('pharmacists', {})
except FileNotFoundError:
    logging.error("❌ File 'professionals_data.json' not found.")
    VALID_DOCTORS = {}
    VALID_PHARMACISTS = {}

# ✅ Autenticación Básica
AUTH_TOKEN = "securetoken123"

def authenticate(request):
    token = request.headers.get('Authorization')
    if not token or token != f"Bearer {AUTH_TOKEN}":
        return False
    return True

# 📌 Buscar profesional
def search_professional(license, nid, user_type):
    """
    Valida si la matrícula y el DNI coinciden con el tipo de profesional.
    """
    logging.info(f"🔍 Validating {user_type} - NID: {nid}, License: {license}")
    if user_type == "doctor":
        return VALID_DOCTORS.get(nid) == license
    elif user_type == "pharmacist":
        return VALID_PHARMACISTS.get(nid) == license
    return False

# 📌 Endpoint de verificación
@app.route('/verify', methods=['POST'])
def verify():
    if not authenticate(request):
        logging.warning("❌ Unauthorized access attempt.")
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    logging.info(f"📥 Received data: {data}")

    # ✅ Validación de datos
    license = data.get('license', '').strip()
    nid = data.get('nid', '').strip()
    user_type = data.get('user_type', '').strip().lower()

    if not license or not nid:
        logging.warning("⚠️ Missing required fields.")
        return jsonify({"error": "Missing license or nid"}), 400

    if user_type not in ["doctor", "pharmacist"]:
        logging.warning("⚠️ Invalid user_type.")
        return jsonify({"error": "Invalid user_type"}), 400

    # ✅ Buscar profesional
    is_valid = search_professional(license, nid, user_type)

    if is_valid:
        logging.info(f"✅ {user_type.capitalize()} validation passed.")
        return jsonify({"valid": True})
    else:
        logging.warning(f"❌ {user_type.capitalize()} validation failed.")
        return jsonify({"valid": False}), 404

# ✅ Ruta de Salud para Diagnóstico
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running", "service": "verify_service"}), 200

if __name__ == "__main__":
    app.run(port=5000)
