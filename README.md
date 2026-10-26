# Curve Scheduler – daily setpoint curves for Home Assistant

[![Validate](https://github.com/timzifer/ha-curve-scheduler/actions/workflows/validate.yml/badge.svg)](https://github.com/timzifer/ha-curve-scheduler/actions/workflows/validate.yml)
[![CI](https://github.com/timzifer/ha-curve-scheduler/actions/workflows/ci.yml/badge.svg)](https://github.com/timzifer/ha-curve-scheduler/actions/workflows/ci.yml)
[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/docs/faq/custom_repositories)

🇩🇪 [Deutsche Anleitung](https://github.com/timzifer/ha-curve-scheduler/blob/main/README.de.md)

**Curve Scheduler** calculates a value that changes over the day and writes it to a
device at regular intervals. The typical use is the hot water circulation
temperature, but it works for any number: buffer tank, room temperature,
pump speed, brightness …

The curve is defined by a few **points** (time → value). Values in between
are interpolated, smoothly and without a jump at midnight. Each day uses a
**daily plan** (e.g. *Workday*, *Day off*, *Holiday*), chosen by the weekly
plan, a holiday calendar or date-range exceptions.

**Everyone can edit the plans directly from a dashboard card**, on the phone
or the desktop, without YAML, automations, developer tools or admin rights.

<p align="center">
  <img src="https://raw.githubusercontent.com/timzifer/ha-curve-scheduler/main/docs/images/today.png" width="420" alt="Card: today's plan">
  <img src="https://raw.githubusercontent.com/timzifer/ha-curve-scheduler/main/docs/images/today-dark-mobile.png" width="260" alt="Card on a phone, dark theme">
</p>

## Features

- Visual curve editor: drag points with mouse or finger, or type the values into fields
- Four kinds of transition: step, linear, smooth and curve (monotone cubic, never overshoots)
- Weekly plan, holiday plan (Workday sensor or any calendar), date-range exceptions such as holidays
- Manual mode ("use the *Day off* plan until tomorrow") through the card, a select entity or an action
- Undo/redo, *Save*/*Discard* and a warning about unsaved changes
- Several cards can be open at the same time; changes appear everywhere, and conflicting saves are detected
- Writes to `number`, `input_number`, `climate` or `water_heater` entities
- German and English, light and dark theme, works from 320 px width

## Installation

### HACS (recommended)

1. Open **HACS** → menu (⋮) → **Custom repositories**.
2. Add `https://github.com/timzifer/ha-curve-scheduler` with the category **Integration**.
3. Search for **Curve Scheduler**, install it, then restart Home Assistant.

### Manual

Copy `custom_components/curve_scheduler` into the `custom_components` folder of
your Home Assistant configuration and restart.

The dashboard card is part of the integration and is registered
automatically. You do **not** have to add a dashboard resource.

## Setup (once, by an administrator)

**Settings → Devices & services → Add integration → Curve Scheduler**

| Setting | Meaning | Default |
|---|---|---|
| Name | e.g. "Circulation" | – |
| Target | `number`, `input_number`, `climate` (attribute `temperature`) or `water_heater` | – |
| Write interval | minutes between two writes (1–60) | 5 |
| Transition between points | step / linear / smooth / curve | curve |
| Minimum / Maximum | allowed range; also the chart's axis | taken from the target, else 20 / 70 |
| Rounding step | value is rounded before writing | 0.5 |
| Unit | shown in the card | taken from the target |
| Holiday source | optional: Workday binary sensor **or** a calendar (each event = day off) | – |
| Write threshold | only write when the value changed by at least this much | 0 |

All settings can be changed later under **Configure**. You can add as many
instances as you like (e.g. circulation and buffer tank). Two example plans,
*Workday* and *Day off*, are created on setup.

> **Workday sensor:** the Workday integration also reports weekends as
> "not a workday". If Saturday and Sunday should use their own plans from the
> weekly plan, set up the Workday sensor with all seven days as workdays, so
> it only reports public holidays.

### Add the card

Edit a dashboard → **Add card** → **Curve Scheduler**. In the card settings you can choose:

- which instance to show,
- **Compact** (today's plan, editor opens on demand) or **Full** (editor always open),
- whether users without admin rights may edit (default: yes).

## Using the card

### Today

<img src="https://raw.githubusercontent.com/timzifer/ha-curve-scheduler/main/docs/images/today.png" width="420" align="right" alt="Today view">

The chart shows today's curve. The red line marks the current time. The text
line summarizes the day, e.g.
*Today: Workday · now 58 °C · from 22:00 → 45 °C*.

- **Mode:** *Automatic* follows the weekly plan. Choosing a plan uses it until you switch back to *Automatic*.
- **Add holiday:** enter a date range and the plan to use during that time.
- **Edit** opens the editor.

<br clear="right">

### Daily plans

<p>
  <img src="https://raw.githubusercontent.com/timzifer/ha-curve-scheduler/main/docs/images/editor-profiles.png" width="420" alt="Daily plan editor">
  <img src="https://raw.githubusercontent.com/timzifer/ha-curve-scheduler/main/docs/images/editor-profiles-mobile.png" width="260" alt="Daily plan editor on a phone">
</p>

- Choose the plan at the top. **+ New plan**, rename, pick a color, **Duplicate** or **Delete plan**.
  A plan that is still used on a weekday, on holidays or by an exception cannot be deleted; the card says where it is used.
- **Drag a point** to change time and value. Points snap to 15 minutes (adjustable) and the rounding step, and cannot pass their neighbors. A label shows time and value while dragging.
- **Tap the line** to add a point there.
- **Tap a point** to select it. Below the chart you can type the time and value, use − / +, or delete it.
- The **table of all points** offers the same without dragging: change times and values, delete points, **+ Point**.
- The dashed end of the curve shows how it continues into the next day.
- **Copy curve from** copies all points from another plan.

### Weekly plan

<img src="https://raw.githubusercontent.com/timzifer/ha-curve-scheduler/main/docs/images/editor-week.png" width="420" alt="Weekly plan">

Choose a plan for each weekday and for holidays. The month overview shows
which plan applies on which day, holidays (★) and exceptions (✈) included.

### Holidays & exceptions

<img src="https://raw.githubusercontent.com/timzifer/ha-curve-scheduler/main/docs/images/editor-exceptions.png" width="420" alt="Exceptions">

Each exception has a date range, a plan and a note. Past entries are grayed
out; they can be removed with one tap or automatically.

### Saving

Changes take effect only after **Save**. **Undo** and **Redo** step through
your changes; **Discard** drops all of them. If somebody else saved in the
meantime, the card shows *"Changed in the meantime – reload?"*.

After saving, the new value is written immediately.

## How the value is calculated

- A plan describes a day from 00:00 to 24:00. **Across midnight** the curve
  runs towards the first point of the **next day's plan**, so switching from
  workday to weekend does not cause a jump (except in *step* mode).
- Priority for a day: **manual mode > exception > holiday > weekday**.
- *Curve* uses monotone cubic interpolation (PCHIP, Fritsch–Carlson). It goes
  through every point, never overshoots and has no kinks. *Smooth* uses
  smoothstep between two points.
- Calculation uses local wall-clock time. On daylight saving days the 02:00–03:00
  hour is skipped or repeated; nothing breaks.
- The value is clamped to min/max and rounded to the step before writing.

The interpolation exists twice, in Python (backend) and TypeScript (card
preview). Both are tested against the same vector file
(`tests/vectors/interpolation.json`, tolerance 1e‑6), so the preview and the
written value match.

## When is the value written?

- every *write interval* (aligned to full minutes),
- immediately on: Home Assistant start (as soon as the target is available), *Save*,
  changing the mode, a change of the holiday source, switching the instance on, and the *Apply now* button,
- only if the value differs from the target's current value; periodic writes also respect the *write threshold*,
- never while the instance is switched off (the sensor still shows the computed value),
- not while the target is `unavailable`/`unknown`: one warning is logged, and the value is written as soon as the target is back.

## Entities

Each instance creates a device **Curve Scheduler &lt;name&gt;** with:

| Entity | Purpose |
|---|---|
| `sensor.<name>_setpoint` | current setpoint; attributes `profile`, `reason` (weekday/holiday/exception/override), `next_point_time`, `next_point_value`, `value_in_1h` |
| `sensor.<name>_profile` | name of the active plan |
| `switch.<name>_active` | instance on/off |
| `select.<name>_mode` | `auto` (Automatic) or a plan (manual mode) |
| `button.<name>_apply_now` | write now |

Mode, switch and all plans survive restarts.

## Actions (services)

| Action | Fields |
|---|---|
| `curve_scheduler.set_override` | `config_entry_id`, `profile` (name or id), optional `until` |
| `curve_scheduler.clear_override` | `config_entry_id` |
| `curve_scheduler.add_exception` | `config_entry_id`, `from`, optional `to`, `profile`, optional `note` – returns `exception_id` |
| `curve_scheduler.remove_exception` | `config_entry_id`, `exception_id` **or** `date` |
| `curve_scheduler.apply_now` | `config_entry_id` |

Example: use the holiday plan while nobody is at home.

```yaml
automation:
  - alias: Hot water – away
    triggers:
      - trigger: state
        entity_id: group.family
        to: not_home
        for: "24:00:00"
    actions:
      - action: curve_scheduler.set_override
        data:
          config_entry_id: 01J...   # pick the instance in the UI editor
          profile: Urlaub
```

## Websocket API

The card uses these commands. None of them requires admin rights.

| Command | Purpose |
|---|---|
| `curve_scheduler/list` | all instances |
| `curve_scheduler/get` | configuration, plans, revision, live state |
| `curve_scheduler/save` | save plans (`revision` for conflict detection); returns translatable validation errors |
| `curve_scheduler/subscribe` | live updates |
| `curve_scheduler/preview` | backend-computed curve of a day (optionally for unsaved plans) |
| `curve_scheduler/holidays` | days off from the holiday source in a date range |

## Development

```bash
# backend
pip install -r requirements_dev.txt
ruff check . && ruff format --check . && mypy custom_components/curve_scheduler
pytest

# card
cd frontend
npm ci
npm run lint && npm run typecheck && npm test
npm run build         # writes custom_components/curve_scheduler/frontend/curve-scheduler-card.js
npm run demo          # demo page with a fake backend on http://localhost:8765/demo/

# shared interpolation vectors (after changing the algorithm)
python scripts/generate_vectors.py
```

The repository contains a devcontainer. `scripts/develop` starts a local Home
Assistant with the integration on port 8123 (see `config/configuration.yaml`).
[docs/ACCEPTANCE.md](https://github.com/timzifer/ha-curve-scheduler/blob/main/docs/ACCEPTANCE.md) documents the acceptance test.

### Releases

HACS installs `curve_scheduler.zip` from the latest GitHub release
(`zip_release` in `hacs.json`), so at least one release must exist. The
*Release* workflow builds the card, sets the version in `manifest.json` from
the tag and attaches the zip. Start it in one of these ways:

- push a tag: `git tag v0.1.0 && git push origin v0.1.0`
- **Actions → Release → Run workflow** and enter the tag, e.g. `v0.1.0`
- publish a release with a new tag on GitHub

For a pushed tag or a manual run, the workflow creates the release itself.

## License

MIT
