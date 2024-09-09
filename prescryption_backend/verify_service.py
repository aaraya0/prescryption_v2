from flask import Flask, request, jsonify

app = Flask(__name__)

def search_professional(matricula, dni):
    # Mockup que simula siempre encontrar el profesional
    print(f"Mockup search: Matricula: {matricula}, DNI: {dni}")
    return True  # Siempre devuelve que el profesional es válido

@app.route('/verify', methods=['POST'])
def verify():
    data = request.json
    print(f"Received data: {data}")

    matricula = data.get('matricula')
    dni = data.get('dni')

    if not matricula or not dni:
        return jsonify({"error": "Missing matricula or dni"}), 400

    is_valid = search_professional(matricula, dni)

    if is_valid:
        return jsonify({"valid": True})
    else:
        return jsonify({"valid": False}), 404

if __name__ == "__main__":
    app.run(port=5000)
