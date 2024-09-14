from flask import Flask, request, jsonify

app = Flask(__name__)

def search_professional(license, nid):
    # Mockup simulates always finding a professional
    print(f"Mockup search: Matricula: {license}, DNI: {nid}")
    return True  # Always returns a positive result

@app.route('/verify', methods=['POST'])
def verify():
    data = request.json
    print(f"Received data: {data}")

    license = data.get('license')
    nid = data.get('nid')

    if not license or not nid:
        return jsonify({"error": "Missing matricula or dni"}), 400

    is_valid = search_professional(license, nid)

    if is_valid:
        return jsonify({"valid": True})
    else:
        return jsonify({"valid": False}), 404

if __name__ == "__main__":
    app.run(port=5000)
