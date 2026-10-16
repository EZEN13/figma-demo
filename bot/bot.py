#!/usr/bin/env python3
"""@smashpadel_bot: приветствие на /start с картинкой и кнопкой мини-приложения.

Только стандартная библиотека, long polling. Токен берётся из переменной BOT_TOKEN
(systemd читает его из /etc/smash-bot.env, в репозиторий не попадает).
"""
import json
import logging
import os
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

TOKEN = os.environ["BOT_TOKEN"]
API = f"https://api.telegram.org/bot{TOKEN}"
APP_URL = os.environ.get("APP_URL", "https://ezen13.github.io/figma-demo/")
HERE = Path(__file__).resolve().parent
PHOTO = HERE / "welcome.png"
STATE = Path(os.environ.get("STATE_DIR", HERE)) / ".photo_id"

CAPTION = (
    "<b>{name}, привет! Это СМЭШ 🎾</b>\n\n"
    "Падел-корты Москвы прямо в Telegram:\n\n"
    "⚡ Корт за 30 секунд: живые свободные слоты\n"
    "👥 Делим на 4: каждый платит только за себя\n"
    "🔥 Открытые матчи: не хватает игрока? Найдём\n"
    "📈 Рейтинг растёт с каждой игрой\n\n"
    "Жми кнопку и выбирай корт на вечер 👇"
)
OTHER = "Всё самое интересное внутри приложения 👇"

log = logging.getLogger("smash-bot")


def call(method, data=None, files=None, timeout=60):
    url = f"{API}/{method}"
    if files:
        boundary = uuid.uuid4().hex
        body = b""
        for k, v in (data or {}).items():
            body += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
        for k, path in files.items():
            body += (
                f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{path.name}"\r\n'
                f"Content-Type: image/png\r\n\r\n"
            ).encode() + path.read_bytes() + b"\r\n"
        body += f"--{boundary}--\r\n".encode()
        req = urllib.request.Request(url, body, {"Content-Type": f"multipart/form-data; boundary={boundary}"})
    else:
        req = urllib.request.Request(url, json.dumps(data or {}).encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        res = json.load(r)
    if not res.get("ok"):
        raise RuntimeError(res)
    return res["result"]


def open_button(start_param=None):
    url = APP_URL + (f"?startapp={start_param}" if start_param else "")
    return json.dumps({"inline_keyboard": [[{"text": "🎾 Открыть СМЭШ", "web_app": {"url": url}}]]})


def html_escape(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def send_welcome(chat_id, name):
    caption = CAPTION.format(name=html_escape(name or "Игрок"))
    base = {"chat_id": chat_id, "caption": caption, "parse_mode": "HTML", "reply_markup": open_button()}
    photo_id = STATE.read_text().strip() if STATE.exists() else None
    if photo_id:
        try:
            return call("sendPhoto", {**base, "photo": photo_id})
        except Exception:
            log.warning("cached photo_id failed, re-uploading")
    if PHOTO.exists():
        msg = call("sendPhoto", base, files={"photo": PHOTO})
        STATE.write_text(msg["photo"][-1]["file_id"])
        return msg
    return call("sendMessage", {"chat_id": chat_id, "text": caption, "parse_mode": "HTML", "reply_markup": open_button()})


def handle(update):
    msg = update.get("message")
    if not msg or "chat" not in msg:
        return
    chat_id = msg["chat"]["id"]
    text = msg.get("text", "")
    if text.startswith("/start"):
        send_welcome(chat_id, msg.get("from", {}).get("first_name"))
    else:
        call("sendMessage", {"chat_id": chat_id, "text": OTHER, "reply_markup": open_button()})


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    call("setMyCommands", {"commands": [{"command": "start", "description": "Открыть СМЭШ"}]})
    me = call("getMe")
    log.info("started as @%s", me["username"])
    offset = None
    while True:
        try:
            updates = call("getUpdates", {"timeout": 50, "offset": offset, "allowed_updates": ["message"]}, timeout=70)
            for u in updates:
                offset = u["update_id"] + 1
                try:
                    handle(u)
                except Exception:
                    log.exception("handle failed")
        except (urllib.error.URLError, TimeoutError, RuntimeError) as e:
            log.warning("poll error: %s", e)
            time.sleep(3)


if __name__ == "__main__":
    main()
