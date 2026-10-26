import asyncio
import json
import sys

import aiohttp

sys.path.insert(0, sys.argv[2])
from setup_instance import BASE, ws_connect

cfg = json.load(open(sys.argv[1]))


async def states(s, h):
    r = await s.get(f"{BASE}/api/states", headers=h)
    return {x["entity_id"]: x for x in await r.json() if "zirk" in x["entity_id"]}


async def main(phase):
    async with aiohttp.ClientSession() as s:
        h = {"Authorization": f"Bearer {cfg['admin']}"}
        if phase == "before":
            await s.post(
                f"{BASE}/api/services/select/select_option",
                headers=h,
                json={"entity_id": "select.zirkulation_mode", "option": "Frei"},
            )
            await s.post(
                f"{BASE}/api/services/switch/turn_off",
                headers=h,
                json={"entity_id": "switch.zirkulation_active"},
            )
            await asyncio.sleep(1)
        st = await states(s, h)
        for k in (
            "select.zirkulation_mode",
            "switch.zirkulation_active",
            "sensor.zirkulation_setpoint",
            "input_number.zirkulation_soll",
        ):
            print(phase, k, st[k]["state"])
        ws = await ws_connect(s, cfg["admin"])
        data = await ws.call(type="curve_scheduler/get", entry_id=cfg["entry_id"])
        print(
            phase,
            "revision",
            data["revision"],
            "sat",
            data["schedule"]["week"]["sat"],
            "exceptions",
            [(e["from"], e["to"]) for e in data["schedule"]["exceptions"]],
            "points",
            len(data["schedule"]["profiles"]["workday"]["points"]),
        )
        if phase == "after":
            prev = await ws.call(
                type="curve_scheduler/preview", entry_id=cfg["entry_id"], step_minutes=1
            )
            now = data["state"]["now"]
            m = int(now[11:13]) * 60 + int(now[14:16])
            print(
                "preview at",
                now[11:16],
                "=",
                round(prev["curve"][m][1], 3),
                "| sensor raw",
                round(data["state"]["raw_value"], 3),
                "| written",
                data["state"]["value"],
            )


asyncio.run(main(sys.argv[3]))
