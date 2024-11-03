# mock_invoice_api.py
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/generate_invoice', methods=['POST'])
def generate_invoice():
    data = request.json
    prescription_id = data.get('prescription_id')
    patient_name = data.get('patient_name')
    total_price = data.get('total_price')
    coverage_percentage = data.get('coverage_percentage')
    final_price = data.get('final_price')

    if not (prescription_id and patient_name and total_price and coverage_percentage and final_price):
        return jsonify({"error": "Missing required data"}), 400

    # Mock invoice format used in Argentina (Factura A format)
    invoice = {
        "invoice_type": "A",
        "invoice_number": f"0001-{prescription_id:08}",
        "patient_name": patient_name,
        "prescription_id": prescription_id,
        "total_price": f"${total_price:.2f}",
        "coverage": f"{coverage_percentage}%",
        "amount_covered": f"${total_price * (coverage_percentage / 100):.2f}",
        "final_price": f"${final_price:.2f}",
        "date": "2024-11-03"  # Example date; replace with current date in production
    }

    return jsonify(invoice)

if __name__ == '__main__':
    app.run(port=4002)
