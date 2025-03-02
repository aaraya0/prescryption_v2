from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
import time

# ✅ Configuración de Selenium
options = webdriver.ChromeOptions()
# Descomentar esta línea si no quieres que se abra el navegador
# options.add_argument("--headless")  
options.add_argument("--disable-gpu")
options.add_argument("--window-size=1920x1080")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

try:
    # 🔍 1. Abre la página
    url = "https://www.argentina.gob.ar/precios-de-medicamentos"
    print(f"🔍 Abriendo la página: {url}")
    driver.get(url)

    # Esperar un momento para cargar la página completamente
    time.sleep(5)

    # 🧐 Buscar iframes en la página
    iframes = driver.find_elements(By.TAG_NAME, "iframe")
    print(f"🧐 Número de iframes detectados: {len(iframes)}")

    if len(iframes) == 0:
        print("❌ No se detectaron iframes. La estructura de la página pudo haber cambiado.")
    else:
        for index, iframe in enumerate(iframes):
            print(f"🔄 Probando con el iframe {index + 1}")
            driver.switch_to.frame(iframe)
            time.sleep(2)  # Dar tiempo para que cargue

            # Verificar si el input de búsqueda está en este iframe
            try:
                search_input = driver.find_element(By.ID, "searchInput")
                print(f"✅ Input encontrado en iframe {index + 1}")
                break  # Si encontramos el input, salimos del bucle
            except Exception:
                print(f"❌ No se encontró el input en el iframe {index + 1}")
                driver.switch_to.default_content()  # Regresar al contenido principal

    # 📝 2. Buscar el campo de búsqueda
    try:
        search_input = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "searchInput"))
        )
        print("✅ Input de búsqueda encontrado y listo para interactuar.")
    except Exception:
        print("❌ No se pudo encontrar el campo de búsqueda.")
        input("🔍 Presiona ENTER para cerrar el navegador...")
        driver.quit()
        exit()

    # 📝 3. Ingresar medicamento en el campo de búsqueda
    medicamento = input("Ingrese el nombre del medicamento: ").strip()
    print(f"🔍 Buscando información para: {medicamento}")

    search_input.clear()
    search_input.send_keys(medicamento)
    search_input.send_keys(Keys.RETURN)  # Simular presionar ENTER
    print("✅ Se escribió en el input y se envió la búsqueda.")

    # ⏳ Esperar los resultados
    time.sleep(3)  # Pausa para que carguen los datos

    # 📌 4. Extraer los datos de la tabla de medicamentos
    medicamentos = []
    filas = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")

    if not filas:
        print(f"⚠️ No se encontraron coincidencias para '{medicamento}'.")
    else:
        for fila in filas:
            columnas = fila.find_elements(By.TAG_NAME, "td")
            if len(columnas) >= 3:
                nombre = columnas[0].text.strip()
                precio_farmacia = columnas[1].text.strip()
                precio_pami = columnas[2].text.strip()

                # Buscar el botón "Ver más" dentro de la fila
                try:
                    ver_mas_button = fila.find_element(By.TAG_NAME, "button")
                    driver.execute_script("arguments[0].click();", ver_mas_button)
                    print(f"🔍 Obteniendo información adicional de: {nombre}")

                    # Esperar a que cargue el modal con detalles
                    time.sleep(2)

                    # Extraer información adicional
                    try:
                        modal_body = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.CLASS_NAME, "modal-body"))
                        )
                        detalles = modal_body.text
                        print(f"✔️ Información adicional: {detalles}")

                        medicamentos.append({
                            "nombre": nombre,
                            "precio_farmacia": precio_farmacia,
                            "precio_pami": precio_pami,
                            "detalles": detalles
                        })

                        # Cerrar el modal si el botón existe
                        try:
                            close_buttons = driver.find_elements(By.CLASS_NAME, "close")
                            if close_buttons:
                                driver.execute_script("arguments[0].click();", close_buttons[0])
                                print(f"✅ Modal cerrado para {nombre}")
                            else:
                                print(f"⚠️ No se encontró botón de cerrar para {nombre}. Probablemente se cerró solo.")

                        except Exception as e:
                            print(f"⚠️ Error al cerrar el modal de {nombre}: {e}")

                    except Exception as e:
                        print(f"⚠️ No se pudo obtener detalles de {nombre}: {e}")

                except Exception as e:
                    print(f"⚠️ No se encontró botón 'Ver más' en {nombre}: {e}")

        # Mostrar los resultados obtenidos
        print("✔️ Resultados obtenidos:")
        for med in medicamentos:
            print(f"- {med['nombre']} | Precio Farmacia: {med['precio_farmacia']} | Precio PAMI: {med['precio_pami']}")
            print(f"  📌 Detalles: {med['detalles']}")

except Exception as e:
    print(f"❌ Error durante el scraping: {e}")

finally:
    input("🔍 Presiona ENTER para cerrar el navegador...")
    driver.quit()  # Cerrar el navegador
