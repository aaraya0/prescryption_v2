from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
# simulated insurance db
INSURANCE_DB = {
    "SWISS MEDICAL": {
        "12345678": {
            "affiliate_number": "SM-987654",
            "insurance_plan": "P063"
        },
        "23456789": {
            "affiliate_number": "SM-123456",
            "insurance_plan": "SM02"
        },
        "34567890": {
            "affiliate_number": "SM-789012",
            "insurance_plan": "SMG2"
        }
    },
    "SANCOR SALUD": {
        "45678901": {
            "affiliate_number": "SS-345678",
            "insurance_plan": "3000B"
        },
        "56789012": {
            "affiliate_number": "SS-901234",
            "insurance_plan": "1000B CC"
        },
        "67890123": {
            "affiliate_number": "SS-567890",
            "insurance_plan": "4000"
        },
        "78901234": {
            "affiliate_number": "SS-432109",
            "insurance_plan": "5000"
        }
    },
    "PREVENCION SALUD": {
        "89012345": {
            "affiliate_number": "PS-567432",
            "insurance_plan": "A5"
        },
        "90123456": {
            "affiliate_number": "PS-678543",
            "insurance_plan": "A2"
        },
        "01234567": {
            "affiliate_number": "PS-789654",
            "insurance_plan": "A4"
        }
    },
    "PAMI": {
        "11111111": {
            "affiliate_number": "PAMI-001122",
            "insurance_plan": "GENERICO"
        },
        "22222222": {
            "affiliate_number": "PAMI-112233",
            "insurance_plan": "GENERICO"
        }
    },
    "MPN": {
        "33333333": {
            "affiliate_number": "MPN-445566",
            "insurance_plan": "GENERICO"
        },
        "44444444": {
            "affiliate_number": "MPN-778899",
            "insurance_plan": "GENERICO"
        }
    }
}


@app.route('/get_affiliation', methods=['POST'])
def get_affiliation():
    data = request.json
    nid = data.get("nid")
    insurance_name = data.get("insurance_name")

    if not nid or not insurance_name:
        return jsonify({"error": "DNI and insurance_name are required"}), 400

    insurance_data = INSURANCE_DB.get(insurance_name, {})
    patient_data = insurance_data.get(nid)

    if patient_data:
        return jsonify({
            "nid": nid,
            "insurance_name": insurance_name,
            "affiliate_number": patient_data["affiliate_number"],
            "insurance_plan": patient_data["insurance_plan"],
            "status": "active"
        }), 200
    else:
        return jsonify({
            "nid": nid,
            "insurance_name": insurance_name,
            "status": "not_found"
        }), 404


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5003, debug=True)