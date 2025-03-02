from flask import Flask, request, jsonify

app = Flask(__name__)

# 🔍 Lista de medicamentos con 70% de cobertura por Resolución 27/2022
RESOLUCION_27_2022 = {
    "acenocumarol", "allopurinol", "amantadina", "amiodarona", "amlodipina",
    "atenolol", "atorvastatín", "bezafibrato", "biperideno", "brimonidina",
    "budesonide", "budesonide+formoterol", "carbamazepina", "carvedilol",
    "clopidogrel", "clozapina", "diltiazem", "dorzolamida+timolol",
    "enalapril", "espironolactona", "ezetimibe", "fenitoína", "fluticasona",
    "fluticasona+salmeterol", "furosemida", "gabapentin", "gemfibrozil",
    "haloperidol", "hidroclorotiazida", "hidroxicloroquina", "indapamida",
    "ipratropio,bromuro", "lamotrigina", "latanoprost", "leflunomida",
    "levodopa+carbidopa", "levomepromazina", "levotiroxina", "losartán",
    "mesalazina", "metotrexato", "montelukast", "olanzapina", "orlistat",
    "oxcarbazepina", "pramipexol", "risperidona", "salbutamol", "simvastatin",
    "sodio,divalproato", "timolol,maleato", "topiramato", "valproico,ác.",
    "verapamilo"
}

# 🔍 Medicamentos con 100% de cobertura por PMO
PMO_MEDICATIONS = {
    "atazanavir", "fosamprenavir", "delavirdina", "entecavir", "enfuvirtide",
    "filgrastim", "molgramostin", "factor vii"
}

# 🔍 Cobertura de obras sociales por plan
INSURANCE_COVERAGE = {
    "SWISS MEDICAL": {"P063": 40, "SM02": 40, "SMG2": 40},
    "SANCOR SALUD": {"3000B": 50, "1000B CC": 40, "4000": 50, "5000": 60},
    "PREVENCION SALUD": {"A5": 50, "A2": 40, "A4": 40},
    "PAMI": {"GENÉRICO": 100},
    "MPN": {"GENÉRICO": 40}
}

@app.route('/api/insurance/coverage', methods=['POST'])
def check_coverage():
    data = request.json
    drug_name = data.get("drug_name", "").strip().lower()
    insurance_name = data.get("insurance_name", "").strip().upper()
    plan = data.get("plan", "").strip().upper()

    if not drug_name or not insurance_name or not plan:
        return jsonify({"error": "Missing required fields"}), 400

    # ✅ Caso 1: Medicamentos con 100% de cobertura (PMO)
    if drug_name in PMO_MEDICATIONS:
        return jsonify({
            "drug_name": drug_name,
            "insurance_name": insurance_name,
            "plan": plan,
            "coverage": 100,
            "source": "PMO - Programa Médico Obligatorio"
        })

    # ✅ Caso 2: Medicamentos con 70% de cobertura (Resolución 27/2022)
    if drug_name in RESOLUCION_27_2022:
        return jsonify({
            "drug_name": drug_name,
            "insurance_name": insurance_name,
            "plan": plan,
            "coverage": 70,
            "source": "Resolución 27/2022"
        })

    # ✅ Caso 3: Cobertura según la obra social y plan
    if insurance_name in INSURANCE_COVERAGE and plan in INSURANCE_COVERAGE[insurance_name]:
        coverage = INSURANCE_COVERAGE[insurance_name][plan]
        return jsonify({
            "drug_name": drug_name,
            "insurance_name": insurance_name,
            "plan": plan,
            "coverage": coverage,
            "source": f"Plan {plan} de {insurance_name}"
        })

    # ❌ Caso 4: Sin cobertura específica
    return jsonify({
        "drug_name": drug_name,
        "insurance_name": insurance_name,
        "plan": plan,
        "coverage": 0,
        "source": "No tiene cobertura"
    })

if __name__ == '__main__':
    app.run(port=5004, debug=True)
