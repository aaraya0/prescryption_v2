from flask import Flask, request, jsonify
import requests
import json

app = Flask(__name__)

def search_professional(matricula, dni):
    url = "https://sisa.msal.gov.ar/sisa/sisa/service/list"
    headers = {
  "Accept": "*/*",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "es-AR,es-419;q=0.9,es;q=0.8",
  "Connection": "keep-alive",
  "Content-Length": "532",
  "Content-Type": "text/x-gwt-rpc; charset=UTF-8",
  "Cookie": "JSESSIONID=52B7342F7C4970AAA8985C1CD479C563.jvm1; __utmz=7153712.1718832208.3.3.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); a28d40bfc02d38069ca0e0818f0ce5e3=b53c82d734a800e4ef1573a37b84c09e; __utma=7153712.495946437.1716841328.1718832208.1720651214.4; __utmc=7153712; __utmt=1; __utmb=7153712.3.10.1720651214",
  "Host": "sisa.msal.gov.ar",
  "Origin": "https://sisa.msal.gov.ar",
  "Referer": "https://sisa.msal.gov.ar/sisa/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "X-GWT-Module-Base": "https://sisa.msal.gov.ar/sisa/sisa/",
  "X-GWT-Permutation": "74021500F007D86EC4DED3691A49A83A",
  "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\""
    }


    body = f'7|0|13|https://sisa.msal.gov.ar/sisa/sisa/|058E6C1D7E8A1C5927086B2570AD66AE|ar.gob.msal.sisa.client.commons.components.lista.service.ListService|getPage|java.lang.Integer/3438268394|java.util.List|Z|ar.gob.msal.sisa.shared.model.list.ComplexFilter/30068811|java.util.ArrayList/4159755760|ar.gob.msal.sisa.client.commons.components.lista.simple.SearchFilter/1978531670|21005|ar.gob.msal.sisa.client.entitys.list.Filter$OPERATION/3408968308|{matricula}|1|2|3|4|10|5|5|5|6|6|5|7|5|6|8|5|80|5|1|-2|9|1|10|11|12|0|0|0|13|0|9|0|0|1|5|100|0|0|'

    response = requests.post(url, headers=headers, data=body)

    if response.status_code == 200:
        response_text = response.text
        if dni in response_text:
            return True
        else:
            return False
    else:
        return False

@app.route('/verify', methods=['POST'])
def verify():
    data = request.json
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
