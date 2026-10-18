"""Generate local QR assets and verify their decoded official destinations.

Development dependencies: qrcode[pil], zxing-cpp. Nothing runs in visitors' browsers.
"""
import json
from pathlib import Path
import qrcode
import zxingcpp
from PIL import Image

root = Path(__file__).resolve().parents[1]
directory = json.loads((root / 'travel-apps.json').read_text(encoding='utf-8'))
target = root / 'images' / 'app-qr'
target.mkdir(parents=True, exist_ok=True)
for app in directory['apps']:
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=4)
    qr.add_data(app['url'])
    qr.make(fit=True)
    path = target / f"{app['id']}.png"
    qr.make_image(fill_color='black', back_color='white').save(path)
    result = zxingcpp.read_barcode(Image.open(path))
    assert result and result.text == app['url'], f"QR destination mismatch: {app['id']}"
    print(f"Verified: {app['id']} -> {result.text}")
