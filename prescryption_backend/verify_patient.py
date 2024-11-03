from flask import Flask, request, jsonify

app = Flask(__name__)

# Datos de ejemplo para diferentes afiliados
mock_data = [
    {
        "name": "Agustin",
        "surname": "Visa",
        "nid": "34325636",
        "insurance_name": "SWISS MEDICAL",
        "affiliate_num": "80000062728191",
        "insurance_plan": "SMG02"
    },
    {
        "name": "Manuela",
        "surname": "Cara",
        "nid": "12345678",
        "insurance_name": "OSDE",
        "affiliate_num": "90000012345678",
        "insurance_plan": "OSDE 310"
    },
    {
        "name": "Adriana",
        "surname": "Perez",
        "nid": "87654321",
        "insurance_name": "GALENO",
        "affiliate_num": "70000087654321",
        "insurance_plan": "Galeno 100"
    },
    {
        "name": "Sofia",
        "surname": "Blanco",
        "nid": "11223344",
        "insurance_name": "MEDIFE",
        "affiliate_num": "60000011223344",
        "insurance_plan": "MEDIFE PLATA"
    }
]

# Endpoint para verificar el plan de obra social del paciente
@app.route('/verify_patient', methods=['GET'])
def verify_patient():
    # Obtener los parámetros de la solicitud
    name = request.args.get('name')
    surname = request.args.get('surname')
    nid = request.args.get('nid')
    insurance_name = request.args.get('insurance_name')
    affiliate_num = request.args.get('affiliate_num')

    # Buscar los datos del paciente en el mock_data
    for patient in mock_data:
        if (patient["name"] == name and
                patient["surname"] == surname and
                patient["nid"] == nid and
                patient["insurance_name"] == insurance_name and
                patient["affiliate_num"] == affiliate_num):
            return jsonify({"insurance_plan": patient["insurance_plan"]})

    # Si no se encuentra el paciente, devolver un error 404
    return jsonify({"message": "Usuario no encontrado o datos incorrectos"}), 404

# Ejecutar la aplicación
if __name__ == '__main__':
    app.run(port=5001)
