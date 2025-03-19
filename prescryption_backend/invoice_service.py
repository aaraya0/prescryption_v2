from flask import Flask, request, jsonify
from datetime import datetime

app = Flask(__name__)

@app.route('/api/invoice/generate', methods=['POST'])
def generate_invoice():
    data = request.json

    # Validar que los datos requeridos están presentes
    required_fields = ["invoiceNumber", "prescriptionId", "pharmacy", "patient", "doctor", "totalAmount", "medications"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Construcción de la factura con datos reales
    invoice = {
        "invoiceNumber": data["invoiceNumber"],
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "pharmacy": {
            "name": data["pharmacy"]["name"],
            "cuit": data["pharmacy"]["cuit"],
            "address": data["pharmacy"]["address"],
            "contact": data["pharmacy"].get("contact", "N/A")
        },
        "patient": {
            "dni": data["patient"]["dni"],
            "name": data["patient"]["name"],
            "address": data["patient"]["address"]
        },
        "doctor": {
            "name": data["doctor"]["name"],
            "surname": data["doctor"]["surname"],
            "specialty": data["doctor"]["specialty"],
            "license": data["doctor"]["license"]
        },
        "prescriptionId": data["prescriptionId"],
        "medications": data["medications"],
        "totalAmount": data["totalAmount"],
        "currency": "ARS",
        "taxes": round(data["totalAmount"] * 0.21, 2),  # Simulación del IVA 21%
        "finalAmount": round(data["totalAmount"] * 1.21, 2)
    }

    return jsonify(invoice), 200

if __name__ == '__main__':
    app.run(port=5005, debug=True)
