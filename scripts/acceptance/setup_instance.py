"""Onboard a fresh HA, create users, set up Curve Scheduler and a dashboard."""

import asyncio
import json
import sys

import aiohttp

BASE = "http://127.0.0.1:8123"
CLIENT = BASE + "/"


async def token_for(session, username, password):
    r = await session.post(
        f"{BASE}/auth/login_flow",
        json={
            "client_id": CLIENT,
            "handler": ["homeassistant", None],
            "redirect_uri": CLIENT + "?auth_callback=1",
        },
    )
    flow = await r.json()
    r = await session.post(
        f"{BASE}/auth/login_flow/{flow['flow_id']}",
        json={"username": username, "password": password, "client_id": CLIENT},
    )
    res = await r.json()
    r = await session.post(
        f"{BASE}/auth/token",
        data={"grant_type": "authorization_code", "code": res["result"], "client_id": CLIENT},
    )
    return await r.json()


class WS:
    def __init__(self, ws):
        self.ws, self.id = ws, 0

    async def call(self, **msg):
        self.id += 1
        await self.ws.send_json({"id": self.id, **msg})
        while True:
            m = await self.ws.receive_json()
            if m.get("id") == self.id and m["type"] == "result":
                if not m["success"]:
                    raise RuntimeError(m)
                return m["result"]


async def ws_connect(session, token):
    ws = await session.ws_connect(f"{BASE}/api/websocket")
    await ws.receive_json()
    await ws.send_json({"type": "auth", "access_token": token})
    assert (await ws.receive_json())["type"] == "auth_ok"
    return WS(ws)


async def main():
    async with aiohttp.ClientSession() as s:
        r = await s.post(
            f"{BASE}/api/onboarding/users",
            json={
                "client_id": CLIENT,
                "name": "Admin",
                "username": "admin",
                "password": "admin-pass-123",
                "language": "de",
            },
        )
        code = (await r.json())["auth_code"]
        r = await s.post(
            f"{BASE}/auth/token",
            data={"grant_type": "authorization_code", "code": code, "client_id": CLIENT},
        )
        admin = (await r.json())["access_token"]
        h = {"Authorization": f"Bearer {admin}"}
        for step in ("core_config", "analytics"):
            await s.post(f"{BASE}/api/onboarding/{step}", headers=h, json={})
        await s.post(
            f"{BASE}/api/onboarding/integration",
            headers=h,
            json={"client_id": CLIENT, "redirect_uri": CLIENT},
        )
        ws = await ws_connect(s, admin)
        user = await ws.call(
            type="config/auth/create", name="Oma", group_ids=["system-users"], local_only=False
        )
        await ws.call(
            type="config/auth_provider/homeassistant/create",
            user_id=user["user"]["id"],
            username="oma",
            password="oma-pass-123",
        )
        # Config flow (as the admin would do in the UI)
        r = await s.post(
            f"{BASE}/api/config/config_entries/flow",
            headers=h,
            json={"handler": "curve_scheduler", "show_advanced_options": False},
        )
        flow = await r.json()
        print("step", flow["step_id"])
        r = await s.post(
            f"{BASE}/api/config/config_entries/flow/{flow['flow_id']}",
            headers=h,
            json={"name": "Zirkulation", "target_entity": "input_number.zirkulation_soll"},
        )
        flow = await r.json()
        print("step", flow["step_id"], [f["name"] for f in flow["data_schema"]])
        defaults = {f["name"]: f.get("default") for f in flow["data_schema"]}
        print("defaults", defaults)
        r = await s.post(
            f"{BASE}/api/config/config_entries/flow/{flow['flow_id']}",
            headers=h,
            json={
                "interval": 5,
                "interpolation": "curve",
                "min_value": defaults["min_value"],
                "max_value": defaults["max_value"],
                "step": 0.5,
                "unit": "°C",
                "write_threshold": 0,
            },
        )
        res = await r.json()
        print("result", res["type"], res["result"]["entry_id"])
        entry_id = res["result"]["entry_id"]
        await ws.call(
            type="lovelace/config/save",
            config={
                "title": "Home",
                "views": [
                    {
                        "title": "Warmwasser",
                        "path": "ww",
                        "cards": [{"type": "custom:curve-scheduler-card", "entry_id": entry_id}],
                    }
                ],
            },
        )
        json.dump(
            {
                "entry_id": entry_id,
                "admin": admin,
                "oma": await token_for(s, "oma", "oma-pass-123"),
            },
            open(sys.argv[1], "w"),
        )
        print("ok")


if __name__ == "__main__":
    asyncio.run(main())
