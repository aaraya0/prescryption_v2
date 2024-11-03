from flask import Flask, request, jsonify

app = Flask(__name__)

# Datos de cobertura por obra social, plan y categoría
coverage_data = {
    "OSDE": {
        "210": {
            "esenciales": 50,
            "cronicos": 60,
            "preventivos": 40
        },
        "310": {
            "esenciales": 80,
            "cronicos": 70,
            "preventivos": 60
        }
    },
    "Galeno": {  # Asegúrate de que el nombre coincide aquí también
        "Galeno 100": {
            "esenciales": 60,
            "cronicos": 50,
            "preventivos": 30
        },
        "Galeno 200": {
            "esenciales": 80,
            "cronicos": 70,
            "preventivos": 50
        }
    },
    "Swiss Medical": {
        "SMG01": {
            "esenciales": 70,
            "cronicos": 60,
            "preventivos": 50
        },
        "SMG02": {
            "esenciales": 90,
            "cronicos": 80,
            "preventivos": 60
        }
    }
}

# Datos de categorías y precios por marca de medicamentos
medication_data = {
    "Ibuprofeno": {
        "categoría": "esenciales",
        "marcas": {
            "Ibupirac": 300,
            "Actron": 320,
            "Genérico": 250
        }
    },
    "Metformina": {
        "categoría": "cronicos",
        "marcas": {
            "Glucophage": 500,
            "Genérico": 450
        }
    },
    "Vitamina C": {
        "categoría": "preventivos",
        "marcas": {
            "Redoxon": 200,
            "Genérico": 150
        }
    },
    "Atorvastatina": {
        "categoría": "cronicos",
        "marcas": {
            "Lipitor": 1200,
            "Genérico": 900
        }
    },
    "Amoxicilina": {
        "categoría": "esenciales",
        "marcas": {
            "Amoxil": 550,
            "Genérico": 500
        }
    }
}

# API de cobertura de medicamentos por obra social
@app.route('/api/insurance/coverage', methods=['GET'])
def get_coverage():
    insurance_name = request.args.get('insurance_name', '').capitalize()  # Capitalize for normalization
    plan = request.args.get('plan', '').title()  # Title case to normalize plan name
    drug_name = request.args.get('drug_name', '').title()  # Title case for drug name

    if not insurance_name or not plan or not drug_name:
        return jsonify({"message": "Faltan datos obligatorios"}), 400

    # Buscar categoría del medicamento
    drug_info = medication_data.get(drug_name)
    if not drug_info:
        return jsonify({"message": "Categoría no encontrada para el medicamento"}), 404

    category = drug_info["categoría"]

    # Buscar cobertura en datos
    insurance = coverage_data.get(insurance_name)
    if not insurance or plan not in insurance:
        return jsonify({"message": "Cobertura no encontrada para el plan de la obra social"}), 404

    coverage_percentage = insurance[plan].get(category)
    if coverage_percentage is None:
        return jsonify({"message": "Cobertura no encontrada para esta categoría"}), 404

    return jsonify({
        "coverage": coverage_percentage,
        "category": category,
        "insurance_name": insurance_name,
        "plan": plan,
        "drug_name": drug_name
    })

# API de precios del vademécum
@app.route('/api/vademecum/price', methods=['GET'])
def get_price():
    drug_name = request.args.get('drug_name', '').title()  # Normalize drug name
    brand = request.args.get('brand', '').capitalize()  # Normalize brand name

    if not drug_name or not brand:
        return jsonify({"message": "Nombre del medicamento y marca son obligatorios"}), 400

    # Buscar precios por droga y marca
    drug_info = medication_data.get(drug_name)
    if drug_info and brand in drug_info["marcas"]:
        price = drug_info["marcas"][brand]
        return jsonify({"price": price, "category": drug_info["categoría"], "drug_name": drug_name, "brand": brand})
    
    return jsonify({"message": "Precio no encontrado para el medicamento y marca especificados"}), 404

if __name__ == '__main__':
    app.run(port=4001)
