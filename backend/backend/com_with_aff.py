#backend/backend/send_wifi_i2c.py
#Ce script envoie les informations Wi-Fi (SSID et mot de passe) à un ESP32 via I2C.
#Il est utilisé pour configurer l'ESP32 avec les informations Wi-Fi nécessaires.
#!/usr/bin/env python3

import smbus
import time
import json
import sys

# Vérification des arguments
if len(sys.argv) != 3:
    print("Usage: send_wifi_i2c.py <ssid> <pwd>")
    sys.exit(1)

ssid = sys.argv[1]
pwd = sys.argv[2]

I2C_ADDR = 0x42  # Adresse de l'ESP32
bus = smbus.SMBus(1)  # /dev/i2c-1

data = {"ssid": ssid, "pwd": pwd}
json_str = json.dumps(data)
data_bytes = [ord(c) for c in json_str]

try:
    for i in range(0, len(data_bytes), 32):  # découpe en blocs de 32 octets
        chunk = data_bytes[i:i+32]
        bus.write_i2c_block_data(I2C_ADDR, 0, chunk)
        time.sleep(0.1)
    print(f"JSON envoyé : {json_str}")
except Exception as e:
    print(f"Erreur d’envoi I2C : {e}")
    sys.exit(1)
