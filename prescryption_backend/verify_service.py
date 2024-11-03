# verify_service.py
from flask import Flask, request, jsonify

app = Flask(__name__)

# Definir ejemplos de DNI y licencias válidos para médicos y farmacéuticos
VALID_DOCTORS = {
    "12345678": "MED123",  # DNI: License
    "87654321": "MED456",
    "24615446": "MED789"
}

VALID_PHARMACISTS = {
    "55555555": "PHA123",
    "44444444": "PHA456",
    "33333333": "PHA789"
}

def search_professional(license, nid, profession_type):
    """
    Simulación de búsqueda de profesional.
    Solo devuelve True si el DNI y la matrícula coinciden en las listas correctas
    de médicos o farmacéuticos.
    """
    print(f"Mockup search: Matricula: {license}, DNI: {nid}, Profesión: {profession_type}")

    if profession_type == "doctor":
        return VALID_DOCTORS.get(nid) == license
    elif profession_type == "pharmacist":
        return VALID_PHARMACISTS.get(nid) == license
    else:
        return False

@app.route('/verify', methods=['POST'])
def verify():
    data = request.json
    print(f"Received data: {data}")

    license = data.get('license')
    nid = data.get('nid')
    profession_type = data.get('profession_type')  # Nuevo campo para especificar el tipo de profesional

    if not license or not nid or not profession_type:
        return jsonify({"error": "Missing matricula, dni, or profession type"}), 400

    is_valid = search_professional(license, nid, profession_type)

    if is_valid:
        return jsonify({"valid": True})
    else:
        return jsonify({"valid": False}), 404

if __name__ == "__main__":
    app.run(port=5000)
